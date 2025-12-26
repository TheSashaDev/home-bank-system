import { db } from '../db/database.js';

// Доступний баланс = баланс - кредитний борг
// Кредитні гроші не можна: переказувати, класти на депозит, давати в борг
export function getAvailableBalance(userId: string): number {
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as { balance: number } | undefined;
  if (!user) return 0;

  const creditDebt = db.prepare(
    'SELECT COALESCE(SUM(remaining_amount), 0) as debt FROM credits WHERE user_id = ? AND status = ?'
  ).get(userId, 'active') as { debt: number };

  return Math.max(0, user.balance - creditDebt.debt);
}

export function getCreditDebt(userId: string): number {
  const result = db.prepare(
    'SELECT COALESCE(SUM(remaining_amount), 0) as debt FROM credits WHERE user_id = ? AND status = ?'
  ).get(userId, 'active') as { debt: number };
  return result.debt;
}

// Загальна сума активних боргів користувача (де він боржник)
export function getTotalDebts(userId: string): number {
  const result = db.prepare(
    'SELECT COALESCE(SUM(remaining_amount), 0) as total FROM debts WHERE from_user_id = ? AND status = ?'
  ).get(userId, 'accepted') as { total: number };
  return result.total;
}
