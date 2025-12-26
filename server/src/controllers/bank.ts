import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { verifyPin } from '../utils/crypto.js';
import { getAvailableBalance, getCreditDebt } from '../utils/balance.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { 
  UserRow, TransactionRow, 
  mapUserRow, mapTransactionRow, 
  TransferRequest 
} from '../types/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/balance', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as { balance: number } | undefined;

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const creditDebt = getCreditDebt(userId);
  const availableBalance = Math.max(0, user.balance - creditDebt);

  res.json({ 
    success: true, 
    data: { 
      balance: user.balance,
      availableBalance,
      creditDebt
    } 
  });
});

router.post('/transfer', (req: AuthRequest, res: Response) => {
  const { toUserId, amount, pin } = req.body as TransferRequest;
  const fromUserId = req.user!.userId;

  if (!toUserId || !amount || !pin) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (amount <= 0) {
    return res.status(400).json({ success: false, error: 'Amount must be positive' });
  }

  if (fromUserId === toUserId) {
    return res.status(400).json({ success: false, error: 'Cannot transfer to yourself' });
  }

  const fromUser = db.prepare('SELECT * FROM users WHERE id = ?').get(fromUserId) as UserRow | undefined;
  const toUser = db.prepare('SELECT * FROM users WHERE id = ?').get(toUserId) as UserRow | undefined;

  if (!fromUser || !toUser) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (!verifyPin(pin, fromUser.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Invalid PIN' });
  }

  const availableBalance = getAvailableBalance(fromUserId);
  if (availableBalance < amount) {
    return res.status(400).json({ success: false, error: 'Недостатньо власних коштів' });
  }

  const txId = crypto.randomUUID();

  const transfer = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, fromUserId);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, toUserId);
    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, ?, ?, ?, 'transfer', ?)
    `).run(txId, fromUserId, toUserId, amount, `Transfer to ${toUser.name}`);
  });

  transfer();

  res.json({ success: true, data: { transactionId: txId } });
});

router.get('/history', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const transactions = db.prepare(`
    SELECT * FROM transactions 
    WHERE from_user_id = ? OR to_user_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(userId, userId) as TransactionRow[];

  res.json({ 
    success: true, 
    data: transactions.map(mapTransactionRow) 
  });
});

router.get('/users', (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.userId;

  // Get all users except current user (for transfer recipient list)
  const users = db.prepare(`
    SELECT id, name, card_number FROM users WHERE id != ?
  `).all(currentUserId) as Pick<UserRow, 'id' | 'name' | 'card_number'>[];

  res.json({ 
    success: true, 
    data: users.map(u => ({ id: u.id, name: u.name, cardNumber: u.card_number }))
  });
});

export default router;
