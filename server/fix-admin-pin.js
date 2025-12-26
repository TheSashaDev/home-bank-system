import Database from 'better-sqlite3';
import crypto from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'data/bank.db');
const db = new Database(dbPath);

const SALT_LENGTH = 16;
const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function hashPin(pin) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

const newHash = hashPin('0000');
db.prepare('UPDATE users SET pin_hash = ?, is_blocked = 0, failed_attempts = 0, blocked_until = NULL WHERE is_admin = 1').run(newHash);

console.log('Admin PIN updated to 0000');
