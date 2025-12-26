import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { verifyPin } from '../utils/crypto.js';
import { getAvailableBalance } from '../utils/balance.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { 
  UserRow, DebtRow, 
  mapDebtRow,
  CreateDebtRequest, PayDebtRequest 
} from '../types/index.js';

const router = Router();
router.use(authMiddleware);

router.post('/create', (req: AuthRequest, res: Response) => {
  const { toUserId, amount, description } = req.body as CreateDebtRequest;
  const fromUserId = req.user!.userId;

  if (!toUserId || !amount) {
    return res.status(400).json({ success: false, error: 'Вкажіть користувача та суму' });
  }

  if (amount <= 0) {
    return res.status(400).json({ success: false, error: 'Сума має бути додатною' });
  }

  if (fromUserId === toUserId) {
    return res.status(400).json({ success: false, error: 'Не можна позичити собі' });
  }

  const toUser = db.prepare('SELECT * FROM users WHERE id = ?').get(toUserId) as UserRow | undefined;
  if (!toUser) {
    return res.status(404).json({ success: false, error: 'Користувача не знайдено' });
  }

  const debtId = crypto.randomUUID();

  db.prepare(`
    INSERT INTO debts (id, from_user_id, to_user_id, amount, remaining_amount, description, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(debtId, fromUserId, toUserId, amount, amount, description || null);

  const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(debtId) as DebtRow;

  res.status(201).json({ success: true, data: mapDebtRow(debt) });
});

router.post('/respond', (req: AuthRequest, res: Response) => {
  const { debtId, accept, pin, interestRate } = req.body;
  const userId = req.user!.userId;

  if (!debtId || accept === undefined || !pin) {
    return res.status(400).json({ success: false, error: 'Вкажіть ID боргу, рішення та PIN' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'Користувача не знайдено' });
  }

  if (!verifyPin(pin, user.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Невірний PIN' });
  }

  const debt = db.prepare(
    'SELECT * FROM debts WHERE id = ? AND to_user_id = ?'
  ).get(debtId, userId) as DebtRow | undefined;

  if (!debt) {
    return res.status(404).json({ success: false, error: 'Запит на борг не знайдено' });
  }

  if (debt.status !== 'pending') {
    return res.status(400).json({ success: false, error: 'Запит вже оброблено' });
  }

  if (accept) {
    const availableBalance = getAvailableBalance(userId);
    if (availableBalance < debt.amount) {
      return res.status(400).json({ success: false, error: 'Недостатньо власних коштів' });
    }

    // Розрахунок суми з відсотками
    const rate = interestRate || 0;
    const totalWithInterest = Math.round(debt.amount * (1 + rate / 100));

    const txId = crypto.randomUUID();

    const acceptDebt = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(debt.amount, userId);
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(debt.amount, debt.from_user_id);
      db.prepare('UPDATE debts SET status = ?, interest_rate = ?, remaining_amount = ? WHERE id = ?')
        .run('accepted', rate / 100, totalWithInterest, debtId);
      db.prepare(`
        INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
        VALUES (?, ?, ?, ?, 'transfer', ?)
      `).run(txId, userId, debt.from_user_id, debt.amount, `Позика${rate > 0 ? ` (${rate}%)` : ''}`);
    });

    acceptDebt();
  } else {
    db.prepare('UPDATE debts SET status = ? WHERE id = ?').run('rejected', debtId);
  }

  const updated = db.prepare('SELECT * FROM debts WHERE id = ?').get(debtId) as DebtRow;

  res.json({ success: true, data: mapDebtRow(updated) });
});

router.post('/pay', (req: AuthRequest, res: Response) => {
  const { debtId, amount, pin } = req.body as PayDebtRequest;
  const userId = req.user!.userId;

  if (!debtId || !amount || !pin) {
    return res.status(400).json({ success: false, error: 'Вкажіть ID боргу, суму та PIN' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'Користувача не знайдено' });
  }

  if (!verifyPin(pin, user.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Невірний PIN' });
  }

  const debt = db.prepare(
    'SELECT * FROM debts WHERE id = ? AND from_user_id = ?'
  ).get(debtId, userId) as DebtRow | undefined;

  if (!debt) {
    return res.status(404).json({ success: false, error: 'Борг не знайдено' });
  }

  if (debt.status !== 'accepted') {
    return res.status(400).json({ success: false, error: 'Борг не активний' });
  }

  // Не можна повертати борг кредитними грошима
  const availableBalance = getAvailableBalance(userId);
  const payAmount = Math.min(amount, debt.remaining_amount);

  if (availableBalance < payAmount) {
    return res.status(400).json({ success: false, error: 'Недостатньо власних коштів' });
  }

  const newRemaining = debt.remaining_amount - payAmount;
  const newStatus = newRemaining <= 0 ? 'paid' : 'accepted';
  const txId = crypto.randomUUID();

  const payDebt = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(payAmount, userId);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(payAmount, debt.to_user_id);
    db.prepare('UPDATE debts SET remaining_amount = ?, status = ? WHERE id = ?')
      .run(newRemaining, newStatus, debtId);
    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, ?, ?, ?, 'transfer', ?)
    `).run(txId, userId, debt.to_user_id, payAmount, 'Повернення боргу');
  });

  payDebt();

  res.json({ 
    success: true, 
    data: { 
      remainingAmount: newRemaining,
      status: newStatus,
      transactionId: txId
    } 
  });
});

// Мої борги (де я боржник)
router.get('/my', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const debts = db.prepare(
    'SELECT * FROM debts WHERE from_user_id = ? ORDER BY created_at DESC'
  ).all(userId) as DebtRow[];

  res.json({ success: true, data: debts.map(mapDebtRow) });
});

// Борги мені (де мені винні)
router.get('/to-me', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const debts = db.prepare(
    'SELECT * FROM debts WHERE to_user_id = ? ORDER BY created_at DESC'
  ).all(userId) as DebtRow[];

  res.json({ success: true, data: debts.map(mapDebtRow) });
});

// Вхідні запити на позику
router.get('/requests', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const requests = db.prepare(
    'SELECT * FROM debts WHERE to_user_id = ? AND status = ? ORDER BY created_at DESC'
  ).all(userId, 'pending') as DebtRow[];

  res.json({ success: true, data: requests.map(mapDebtRow) });
});

export default router;
