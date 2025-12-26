import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { verifyPin } from '../utils/crypto.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Створити запит на вивід
router.post('/create', (req: AuthRequest, res: Response) => {
  const { amount, cardNumber, pin } = req.body;
  const userId = req.user!.userId;

  if (!amount || !cardNumber || !pin) {
    return res.status(400).json({ success: false, error: 'Вкажіть суму, номер картки та PIN' });
  }

  if (amount <= 0) {
    return res.status(400).json({ success: false, error: 'Сума має бути додатною' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ success: false, error: 'Користувача не знайдено' });

  if (!verifyPin(pin, user.pin_hash)) {
    return res.status(401).json({ success: false, error: 'Невірний PIN' });
  }

  // Можна виводити будь-які гроші (включаючи кредитні та боргові)
  if (user.balance < amount) {
    return res.status(400).json({ success: false, error: 'Недостатньо коштів' });
  }

  const reqId = crypto.randomUUID();

  db.prepare(`
    INSERT INTO withdrawal_requests (id, user_id, amount, card_number, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(reqId, userId, amount, cardNumber);

  res.status(201).json({ success: true, data: { id: reqId } });
});

// Мої запити
router.get('/my', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const requests = db.prepare(`
    SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId) as any[];

  const mapped = requests.map(r => ({
    id: r.id,
    amount: r.amount,
    cardNumber: r.card_number,
    status: r.status,
    adminComment: r.admin_comment,
    createdAt: new Date(r.created_at * 1000).toISOString(),
    processedAt: r.processed_at ? new Date(r.processed_at * 1000).toISOString() : null
  }));

  res.json({ success: true, data: mapped });
});


// Адмін: всі запити
router.get('/all', adminMiddleware, (req: AuthRequest, res: Response) => {
  const requests = db.prepare(`
    SELECT w.*, u.name as user_name 
    FROM withdrawal_requests w
    JOIN users u ON w.user_id = u.id
    ORDER BY w.created_at DESC
  `).all() as any[];

  const mapped = requests.map(r => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    amount: r.amount,
    cardNumber: r.card_number,
    status: r.status,
    adminComment: r.admin_comment,
    createdAt: new Date(r.created_at * 1000).toISOString(),
    processedAt: r.processed_at ? new Date(r.processed_at * 1000).toISOString() : null
  }));

  res.json({ success: true, data: mapped });
});

// Адмін: схвалити/відхилити
router.post('/process', adminMiddleware, (req: AuthRequest, res: Response) => {
  const { requestId, approve, comment } = req.body;

  if (!requestId || approve === undefined) {
    return res.status(400).json({ success: false, error: 'Вкажіть ID запиту та рішення' });
  }

  const request = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(requestId) as any;
  if (!request) return res.status(404).json({ success: false, error: 'Запит не знайдено' });
  if (request.status !== 'pending') {
    return res.status(400).json({ success: false, error: 'Запит вже оброблено' });
  }

  const now = Math.floor(Date.now() / 1000);

  if (approve) {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(request.user_id) as any;
    if (user.balance < request.amount) {
      return res.status(400).json({ success: false, error: 'У користувача недостатньо коштів' });
    }

    const txId = crypto.randomUUID();

    db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(request.amount, request.user_id);
      db.prepare('UPDATE withdrawal_requests SET status = ?, admin_comment = ?, processed_at = ? WHERE id = ?')
        .run('approved', comment || null, now, requestId);
      db.prepare(`
        INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description)
        VALUES (?, ?, ?, ?, 'withdrawal', ?)
      `).run(txId, request.user_id, request.user_id, request.amount, `Вивід на ${request.card_number}`);
    })();
  } else {
    db.prepare('UPDATE withdrawal_requests SET status = ?, admin_comment = ?, processed_at = ? WHERE id = ?')
      .run('rejected', comment || 'Відхилено', now, requestId);
  }

  res.json({ success: true });
});

export default router;
