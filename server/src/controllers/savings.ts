import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { verifyPin } from '../utils/crypto.js';
import { getAvailableBalance } from '../utils/balance.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { 
  UserRow, SavingsRow, 
  mapSavingsRow,
  SavingsDepositRequest, SavingsWithdrawRequest 
} from '../types/index.js';

const router = Router();
router.use(authMiddleware);

const DEFAULT_SAVINGS_RATE = 0.08;

function getOrCreateSavings(userId: string): SavingsRow {
  let savings = db.prepare('SELECT * FROM savings WHERE user_id = ?').get(userId) as SavingsRow | undefined;
  
  if (!savings) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO savings (id, user_id, amount, interest_rate)
      VALUES (?, ?, 0, ?)
    `).run(id, userId, DEFAULT_SAVINGS_RATE);
    savings = db.prepare('SELECT * FROM savings WHERE id = ?').get(id) as SavingsRow;
  }
  
  return savings;
}

function accrueInterest(savings: SavingsRow): number {
  const now = Math.floor(Date.now() / 1000);
  const daysSinceLastInterest = (now - savings.last_interest_date) / (24 * 60 * 60);
  
  if (daysSinceLastInterest < 1 || savings.amount <= 0) return 0;
  
  const dailyRate = savings.interest_rate / 365;
  const interest = Math.floor(savings.amount * dailyRate * Math.floor(daysSinceLastInterest));
  
  if (interest > 0) {
    const txId = crypto.randomUUID();
    db.prepare('UPDATE savings SET amount = amount + ?, last_interest_date = ? WHERE id = ?')
      .run(interest, now, savings.id);
    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, NULL, ?, ?, 'interest', 'Нарахування відсотків')
    `).run(txId, savings.user_id, interest);
  }
  
  return interest;
}

router.post('/deposit', (req: AuthRequest, res: Response) => {
  const { amount, pin } = req.body as SavingsDepositRequest;
  const userId = req.user!.userId;

  if (!amount || !pin) {
    return res.status(400).json({ success: false, error: 'Вкажіть суму та PIN' });
  }

  if (amount <= 0) {
    return res.status(400).json({ success: false, error: 'Сума має бути додатною' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'Користувача не знайдено' });
  }

  if (!verifyPin(pin, user.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Невірний PIN' });
  }

  // Не можна класти кредитні гроші на депозит
  const availableBalance = getAvailableBalance(userId);
  if (availableBalance < amount) {
    return res.status(400).json({ success: false, error: 'Недостатньо власних коштів' });
  }

  const savings = getOrCreateSavings(userId);
  accrueInterest(savings);

  const txId = crypto.randomUUID();

  const deposit = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
    db.prepare('UPDATE savings SET amount = amount + ? WHERE id = ?').run(amount, savings.id);
    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, ?, ?, ?, 'savings_deposit', 'Поповнення депозиту')
    `).run(txId, userId, userId, amount);
  });

  deposit();

  const updated = db.prepare('SELECT * FROM savings WHERE id = ?').get(savings.id) as SavingsRow;

  res.json({ success: true, data: { savings: mapSavingsRow(updated), transactionId: txId } });
});

// Зняти з депозиту
router.post('/withdraw', (req: AuthRequest, res: Response) => {
  const { amount, pin } = req.body as SavingsWithdrawRequest;
  const userId = req.user!.userId;

  if (!amount || !pin) {
    return res.status(400).json({ success: false, error: 'Вкажіть суму та PIN' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'Користувача не знайдено' });
  }

  if (!verifyPin(pin, user.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Невірний PIN' });
  }

  const savings = getOrCreateSavings(userId);
  accrueInterest(savings);

  const currentSavings = db.prepare('SELECT * FROM savings WHERE id = ?').get(savings.id) as SavingsRow;

  if (currentSavings.amount < amount) {
    return res.status(400).json({ success: false, error: 'Недостатньо коштів на депозиті' });
  }

  const txId = crypto.randomUUID();

  const withdraw = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);
    db.prepare('UPDATE savings SET amount = amount - ? WHERE id = ?').run(amount, savings.id);
    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, NULL, ?, ?, 'savings_withdrawal', 'Зняття з депозиту')
    `).run(txId, userId, amount);
  });

  withdraw();

  const updated = db.prepare('SELECT * FROM savings WHERE id = ?').get(savings.id) as SavingsRow;

  res.json({ success: true, data: { savings: mapSavingsRow(updated), transactionId: txId } });
});

// Мій депозит
router.get('/my', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const savings = getOrCreateSavings(userId);
  accrueInterest(savings);

  const updated = db.prepare('SELECT * FROM savings WHERE id = ?').get(savings.id) as SavingsRow;

  res.json({ success: true, data: mapSavingsRow(updated) });
});

export default router;
