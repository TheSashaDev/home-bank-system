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

function generateCardNumber(): string {
  return Math.random().toString().slice(2, 6);
}

export default router;
