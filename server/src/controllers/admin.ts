import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { hashPin } from '../utils/crypto.js';
import { encodeQR } from '../utils/qr.js';
import { generateCardPDF, generateSingleCardPDF } from '../utils/cardGenerator.js';
import { generateATMPDF } from '../utils/atmGenerator.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';
import { 
  UserRow, 
  mapUserRow, 
  DepositRequest, 
  CreateUserRequest 
} from '../types/index.js';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.post('/deposit', (req: AuthRequest, res: Response) => {
  const { userId, amount } = req.body as DepositRequest;

  if (!userId || !amount) {
    return res.status(400).json({ success: false, error: 'User ID and amount required' });
  }

  if (amount <= 0) {
    return res.status(400).json({ success: false, error: 'Amount must be positive' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const txId = crypto.randomUUID();

  const deposit = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);
    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, NULL, ?, ?, 'deposit', 'Admin deposit')
    `).run(txId, userId, amount);
  });

  deposit();

  const updated = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as { balance: number };

  res.json({ 
    success: true, 
    data: { 
      transactionId: txId,
      newBalance: updated.balance 
    } 
  });
});

router.post('/create-user', async (req: AuthRequest, res: Response) => {
  const { name, pin, isAdmin = false } = req.body as CreateUserRequest;

  if (!name || !pin) {
    return res.status(400).json({ success: false, error: 'Name and PIN required' });
  }

  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ success: false, error: 'PIN must be 4 digits' });
  }

  const userId = crypto.randomUUID();
  const pinHash = hashPin(pin);
  const cardNumber = generateCardNumber();

  db.prepare(`
    INSERT INTO users (id, name, pin_hash, balance, is_admin, card_number)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(userId, name, pinHash, isAdmin ? 1 : 0, cardNumber);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow;
  const qrCode = encodeQR(userId);

  res.status(201).json({ 
    success: true, 
    data: { 
      user: mapUserRow(user),
      qrCode 
    } 
  });
});

// Скачать PDF карточки для одного пользователя
router.get('/card-pdf/:userId', async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  try {
    const pdf = await generateSingleCardPDF({
      userId: user.id,
      name: user.name,
      cardNumber: user.card_number
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="card-${user.card_number}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

// Скачать PDF со всеми карточками
router.get('/cards-pdf', async (req: AuthRequest, res: Response) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as UserRow[];

  if (users.length === 0) {
    return res.status(404).json({ success: false, error: 'No users found' });
  }

  try {
    const cards = users.map(u => ({
      userId: u.id,
      name: u.name,
      cardNumber: u.card_number
    }));

    const pdf = await generateCardPDF(cards);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="all-cards.pdf"');
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

router.get('/users', (req: AuthRequest, res: Response) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as UserRow[];

  res.json({ 
    success: true, 
    data: users.map(mapUserRow) 
  });
});

// Скачать PDF с развёрткой банкомата
router.get('/atm-pdf', async (req: AuthRequest, res: Response) => {
  try {
    const pdf = await generateATMPDF();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="atm-template.pdf"');
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

// Block/unblock user
router.post('/block-user', (req: AuthRequest, res: Response) => {
  const { userId, blocked } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(blocked ? 1 : 0, userId);
  res.json({ success: true });
});

// Delete user
router.delete('/user/:userId', (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  if (user.is_admin) return res.status(400).json({ success: false, error: 'Cannot delete admin' });

  db.transaction(() => {
    db.prepare('DELETE FROM transactions WHERE from_user_id = ? OR to_user_id = ?').run(userId, userId);
    db.prepare('DELETE FROM credits WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM savings WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM debts WHERE from_user_id = ? OR to_user_id = ?').run(userId, userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  })();

  res.json({ success: true });
});

// Reset PIN
router.post('/reset-pin', (req: AuthRequest, res: Response) => {
  const { userId, newPin } = req.body;
  if (!userId || !newPin) return res.status(400).json({ success: false, error: 'User ID and new PIN required' });
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return res.status(400).json({ success: false, error: 'PIN must be 4 digits' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  const pinHash = hashPin(newPin);
  db.prepare('UPDATE users SET pin_hash = ?, failed_attempts = 0, is_blocked = 0 WHERE id = ?').run(pinHash, userId);
  res.json({ success: true });
});

// Withdraw from user (admin takes money)
router.post('/withdraw', (req: AuthRequest, res: Response) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) return res.status(400).json({ success: false, error: 'User ID and amount required' });
  if (amount <= 0) return res.status(400).json({ success: false, error: 'Amount must be positive' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  if (user.balance < amount) return res.status(400).json({ success: false, error: 'Insufficient balance' });

  const txId = crypto.randomUUID();
  db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
      VALUES (?, ?, NULL, ?, 'withdrawal', 'Admin withdrawal')
    `).run(txId, userId, amount);
  })();

  const updated = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as { balance: number };
  res.json({ success: true, data: { transactionId: txId, newBalance: updated.balance } });
});

// Get all transactions (system-wide)
router.get('/transactions', (req: AuthRequest, res: Response) => {
  const txs = db.prepare(`
    SELECT t.*, 
      u1.name as from_name, 
      u2.name as to_name
    FROM transactions t
    LEFT JOIN users u1 ON t.from_user_id = u1.id
    LEFT JOIN users u2 ON t.to_user_id = u2.id
    ORDER BY t.created_at DESC
    LIMIT 100
  `).all();
  res.json({ success: true, data: txs });
});

// Get stats
router.get('/stats', (req: AuthRequest, res: Response) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_admin = 0').get() as any).c;
  const totalBalance = (db.prepare('SELECT SUM(balance) as s FROM users').get() as any).s || 0;
  const totalCredits = (db.prepare('SELECT SUM(remaining_amount) as s FROM credits WHERE status = ?').get('active') as any).s || 0;
  const totalSavings = (db.prepare('SELECT SUM(amount) as s FROM savings').get() as any).s || 0;
  const totalDebts = (db.prepare('SELECT SUM(remaining_amount) as s FROM debts WHERE status = ?').get('accepted') as any).s || 0;
  const txToday = (db.prepare(`SELECT COUNT(*) as c FROM transactions WHERE date(created_at) = date('now')`).get() as any).c;

  res.json({ success: true, data: { totalUsers, totalBalance, totalCredits, totalSavings, totalDebts, txToday } });
});

// Get all credits
router.get('/credits', (req: AuthRequest, res: Response) => {
  const credits = db.prepare(`
    SELECT c.*, u.name as user_name 
    FROM credits c 
    JOIN users u ON c.user_id = u.id 
    ORDER BY c.created_at DESC
  `).all();
  res.json({ success: true, data: credits });
});

// Get all debts
router.get('/debts', (req: AuthRequest, res: Response) => {
  const debts = db.prepare(`
    SELECT d.*, 
      u1.name as from_name, 
      u2.name as to_name
    FROM debts d
    JOIN users u1 ON d.from_user_id = u1.id
    JOIN users u2 ON d.to_user_id = u2.id
    ORDER BY d.created_at DESC
  `).all();
  res.json({ success: true, data: debts });
});

// Forgive credit (admin cancels credit)
router.post('/forgive-credit', (req: AuthRequest, res: Response) => {
  const { creditId } = req.body;
  if (!creditId) return res.status(400).json({ success: false, error: 'Credit ID required' });

  const credit = db.prepare('SELECT * FROM credits WHERE id = ?').get(creditId) as any;
  if (!credit) return res.status(404).json({ success: false, error: 'Credit not found' });

  db.prepare('UPDATE credits SET status = ?, remaining_amount = 0 WHERE id = ?').run('paid', creditId);
  res.json({ success: true });
});

// Forgive debt
router.post('/forgive-debt', (req: AuthRequest, res: Response) => {
  const { debtId } = req.body;
  if (!debtId) return res.status(400).json({ success: false, error: 'Debt ID required' });

  const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(debtId) as any;
  if (!debt) return res.status(404).json({ success: false, error: 'Debt not found' });

  db.prepare('UPDATE debts SET status = ?, remaining_amount = 0 WHERE id = ?').run('paid', debtId);
  res.json({ success: true });
});

function generateCardNumber(): string {
  return Math.random().toString().slice(2, 6);
}

export default router;
