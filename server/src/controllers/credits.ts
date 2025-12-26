import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { verifyPin } from '../utils/crypto.js';
import { getAvailableBalance, getTotalDebts } from '../utils/balance.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { 
  UserRow, CreditRow, 
  mapCreditRow,
  TakeCreditRequest, PayCreditRequest 
} from '../types/index.js';

const router = Router();
router.use(authMiddleware);

const DEFAULT_INTEREST_RATE = 0.15;
const MAX_CREDIT_AMOUNT = 10000000;

router.post('/take', (req: AuthRequest, res: Response) => {
  const { amount, months, pin } = req.body as TakeCreditRequest;
  const userId = req.user!.userId;

  if (!amount || !months || !pin) {
    return res.status(400).json({ success: false, error: 'Вкажіть суму, термін та PIN' });
  }

  if (amount <= 0 || amount > MAX_CREDIT_AMOUNT) {
    return res.status(400).json({ success: false, error: 'Некоректна сума кредиту' });
  }

  if (months < 1 || months > 24) {
    return res.status(400).json({ success: false, error: 'Термін від 1 до 24 місяців' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'Користувача не знайдено' });
  }

  if (!verifyPin(pin, user.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Невірний PIN' });
  }

  // Не можна брати кредит якщо є активний
  const activeCredit = db.prepare(
    'SELECT id FROM credits WHERE user_id = ? AND status = ?'
  ).get(userId, 'active');

  if (activeCredit) {
    return res.status(400).json({ success: false, error: 'У вас вже є активний кредит' });
  }

  // Не можна брати кредит якщо є непогашені борги
  const totalDebts = getTotalDebts(userId);
  if (totalDebts > 0) {
    return res.status(400).json({ success: false, error: 'Спочатку погасіть борги' });
  }

  const totalWithInterest = Math.round(amount * (1 + DEFAULT_INTEREST_RATE * (months / 12)));
  const monthlyPayment = Math.round(totalWithInterest / months);
  const dueDate = Math.floor(Date.now() / 1000) + (months * 30 * 24 * 60 * 60);

  const creditId = crypto.randomUUID();
  const txId = crypto.randomUUID();

  const takeCredit = db.transaction(() => {
    db.prepare(`
      INSERT INTO credits (id, user_id, amount, remaining_amount, interest_rate, monthly_payment, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(creditId, userId, amount, totalWithInterest, DEFAULT_INTEREST_RATE, monthlyPayment, dueDate);

    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);

    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, NULL, ?, ?, 'credit', ?)
    `).run(txId, userId, amount, `Кредит на ${months} міс.`);
  });

  takeCredit();

  const credit = db.prepare('SELECT * FROM credits WHERE id = ?').get(creditId) as CreditRow;

  res.status(201).json({ 
    success: true, 
    data: { 
      credit: mapCreditRow(credit),
      monthlyPayment,
      totalAmount: totalWithInterest
    } 
  });
});

router.post('/pay', (req: AuthRequest, res: Response) => {
  const { creditId, amount, pin } = req.body as PayCreditRequest;
  const userId = req.user!.userId;

  if (!creditId || !amount || !pin) {
    return res.status(400).json({ success: false, error: 'Вкажіть ID кредиту, суму та PIN' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'Користувача не знайдено' });
  }

  if (!verifyPin(pin, user.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Невірний PIN' });
  }

  const credit = db.prepare(
    'SELECT * FROM credits WHERE id = ? AND user_id = ?'
  ).get(creditId, userId) as CreditRow | undefined;

  if (!credit) {
    return res.status(404).json({ success: false, error: 'Кредит не знайдено' });
  }

  if (credit.status !== 'active') {
    return res.status(400).json({ success: false, error: 'Кредит вже погашено' });
  }

  // Не можна платити кредитними грошима
  const availableBalance = getAvailableBalance(userId);
  const payAmount = Math.min(amount, credit.remaining_amount);

  if (availableBalance < payAmount) {
    return res.status(400).json({ success: false, error: 'Недостатньо власних коштів' });
  }

  const newRemaining = credit.remaining_amount - payAmount;
  const newStatus = newRemaining <= 0 ? 'paid' : 'active';
  const txId = crypto.randomUUID();

  const payCredit = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(payAmount, userId);
    db.prepare('UPDATE credits SET remaining_amount = ?, status = ? WHERE id = ?')
      .run(newRemaining, newStatus, creditId);

    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, ?, ?, ?, 'credit_payment', ?)
    `).run(txId, userId, userId, payAmount, 'Погашення кредиту');
  });

  payCredit();

  res.json({ 
    success: true, 
    data: { 
      remainingAmount: newRemaining,
      status: newStatus,
      transactionId: txId
    } 
  });
});

router.get('/my', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const credits = db.prepare(
    'SELECT * FROM credits WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId) as CreditRow[];

  res.json({ success: true, data: credits.map(mapCreditRow) });
});

export default router;
