import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { verifyPin } from '../utils/crypto.js';
import { getAvailableBalance, getTotalDebts } from '../utils/balance.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { UserRow } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

// 8% в тиждень
const WEEKLY_INTEREST_RATE = 0.08;
const MAX_CREDIT_AMOUNT = 10000000;

router.post('/take', (req: AuthRequest, res: Response) => {
  const { amount, weeks, pin } = req.body;
  const userId = req.user!.userId;

  if (!amount || !weeks || !pin) {
    return res.status(400).json({ success: false, error: 'Вкажіть суму, термін та PIN' });
  }

  if (amount <= 0 || amount > MAX_CREDIT_AMOUNT) {
    return res.status(400).json({ success: false, error: 'Некоректна сума кредиту' });
  }

  if (weeks < 1 || weeks > 12) {
    return res.status(400).json({ success: false, error: 'Термін від 1 до 12 тижнів' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) return res.status(404).json({ success: false, error: 'Користувача не знайдено' });

  if (!verifyPin(pin, user.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Невірний PIN' });
  }

  const activeCredit = db.prepare('SELECT id FROM credits WHERE user_id = ? AND status = ?').get(userId, 'active');
  if (activeCredit) {
    return res.status(400).json({ success: false, error: 'У вас вже є активний кредит' });
  }

  const totalDebts = getTotalDebts(userId);
  if (totalDebts > 0) {
    return res.status(400).json({ success: false, error: 'Спочатку погасіть борги' });
  }

  // 8% за кожен тиждень
  const totalWithInterest = Math.round(amount * (1 + WEEKLY_INTEREST_RATE * weeks));
  const weeklyPayment = Math.round(totalWithInterest / weeks);
  const dueDate = Math.floor(Date.now() / 1000) + (weeks * 7 * 24 * 60 * 60);

  const creditId = crypto.randomUUID();
  const txId = crypto.randomUUID();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO credits (id, user_id, amount, remaining_amount, interest_rate, weeks, weekly_payment, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(creditId, userId, amount, totalWithInterest, WEEKLY_INTEREST_RATE, weeks, weeklyPayment, dueDate);

    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);

    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, NULL, ?, ?, 'credit', ?)
    `).run(txId, userId, amount, `Кредит на ${weeks} тижн.`);
  })();

  res.status(201).json({ 
    success: true, 
    data: { 
      creditId,
      weeklyPayment,
      totalAmount: totalWithInterest
    } 
  });
});


router.post('/pay', (req: AuthRequest, res: Response) => {
  const { creditId, amount, pin } = req.body;
  const userId = req.user!.userId;

  if (!creditId || !amount || !pin) {
    return res.status(400).json({ success: false, error: 'Вкажіть ID кредиту, суму та PIN' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) return res.status(404).json({ success: false, error: 'Користувача не знайдено' });

  if (!verifyPin(pin, user.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Невірний PIN' });
  }

  const credit = db.prepare('SELECT * FROM credits WHERE id = ? AND user_id = ?').get(creditId, userId) as any;
  if (!credit) return res.status(404).json({ success: false, error: 'Кредит не знайдено' });
  if (credit.status !== 'active') return res.status(400).json({ success: false, error: 'Кредит вже погашено' });

  const availableBalance = getAvailableBalance(userId);
  const payAmount = Math.min(amount, credit.remaining_amount);

  if (availableBalance < payAmount) {
    return res.status(400).json({ success: false, error: 'Недостатньо власних коштів' });
  }

  const newRemaining = credit.remaining_amount - payAmount;
  const newStatus = newRemaining <= 0 ? 'paid' : 'active';
  const txId = crypto.randomUUID();

  db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(payAmount, userId);
    db.prepare('UPDATE credits SET remaining_amount = ?, status = ? WHERE id = ?').run(newRemaining, newStatus, creditId);
    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, ?, ?, ?, 'credit_payment', 'Погашення кредиту')
    `).run(txId, userId, userId, payAmount);
  })();

  res.json({ success: true, data: { remainingAmount: newRemaining, status: newStatus, transactionId: txId } });
});

router.get('/my', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const credits = db.prepare('SELECT * FROM credits WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  
  const mapped = (credits as any[]).map(c => ({
    id: c.id,
    userId: c.user_id,
    amount: c.amount,
    remainingAmount: c.remaining_amount,
    interestRate: c.interest_rate,
    weeks: c.weeks,
    weeklyPayment: c.weekly_payment,
    status: c.status,
    dueDate: new Date(c.due_date * 1000).toISOString(),
    createdAt: new Date(c.created_at * 1000).toISOString()
  }));

  res.json({ success: true, data: mapped });
});

export default router;
