import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'data/bank.db');
const db = new Database(dbPath);

db.prepare('UPDATE users SET is_blocked = 0, failed_attempts = 0, blocked_until = NULL WHERE is_admin = 1').run();

console.log('Admin unblocked!');
