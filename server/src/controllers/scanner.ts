import { Router } from 'express';
import { db } from '../db/database.js';
import { decodeQR } from '../utils/qr.js';
import { UserRow, mapUserRow } from '../types/index.js';
import { broadcastScan } from '../websocket.js';

const router = Router();

router.post('/scan', (req, res) => {
  const { qrData } = req.body;

  if (!qrData) {
    return res.status(400).json({ success: false, error: 'QR data required' });
  }

  const userId = decodeQR(qrData);
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Invalid QR code' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const userData = mapUserRow(user);
  
  // Broadcast to connected tablets
  broadcastScan({
    type: 'card_scanned',
    user: {
      id: userData.id,
      name: userData.name,
      cardNumber: userData.cardNumber,
      balance: userData.balance
    },
    qrData: qrData,
    timestamp: Date.now()
  });

  res.json({
    success: true,
    data: {
      userId: userData.id,
      userName: userData.name,
      cardNumber: userData.cardNumber
    }
  });
});

export default router;
