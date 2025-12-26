import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { decodeQR } from '../utils/qr.js';
import { verifyPin } from '../utils/crypto.js';
import { signToken, authMiddleware, AuthRequest } from '../middleware/auth.js';
import { UserRow, mapUserRow, LoginRequest } from '../types/index.js';

const router = Router();

const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 3;

router.post('/login', (req, res) => {
  const { qrData, pin } = req.body as LoginRequest;

  if (!qrData || !pin) {
    return res.status(400).json({ success: false, error: 'QR data and PIN required' });
  }

  const userId = decodeQR(qrData);
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Invalid QR code' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Check if blocked
  if (user.is_blocked && user.blocked_until && user.blocked_until > Date.now()) {
    const remainingMs = user.blocked_until - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return res.status(403).json({ 
      success: false, 
      error: `Card blocked for ${remainingMin} minute(s)` 
    });
  }

  // Unblock if time passed
  if (user.is_blocked && user.blocked_until && user.blocked_until <= Date.now()) {
    db.prepare('UPDATE users SET is_blocked = 0, failed_attempts = 0, blocked_until = NULL WHERE id = ?')
      .run(userId);
  }

  // Verify PIN
  const valid = verifyPin(pin, user.pin_hash);
  if (!valid) {
    const attempts = user.failed_attempts + 1;
    
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const blockedUntil = Date.now() + BLOCK_DURATION_MS;
      db.prepare('UPDATE users SET is_blocked = 1, blocked_until = ?, failed_attempts = ? WHERE id = ?')
        .run(blockedUntil, attempts, userId);
      return res.status(403).json({ 
        success: false, 
        error: 'Card blocked for 5 minutes' 
      });
    }

    db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(attempts, userId);
    return res.status(401).json({ 
      success: false, 
      error: `Invalid PIN. ${MAX_FAILED_ATTEMPTS - attempts} attempts remaining` 
    });
  }

  // Reset failed attempts on success
  db.prepare('UPDATE users SET failed_attempts = 0, is_blocked = 0, blocked_until = NULL WHERE id = ?')
    .run(userId);

  const token = signToken({ userId: user.id, isAdmin: user.is_admin === 1 });
  
  res.json({
    success: true,
    data: {
      token,
      user: mapUserRow(user)
    }
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as UserRow | undefined;
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  res.json({ success: true, data: mapUserRow(user) });
});

export default router;
