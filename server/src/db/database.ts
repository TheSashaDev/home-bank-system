import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { hashPin } from '../utils/crypto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dataDir = join(__dirname, '../../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'bank.db');
export const db: Database.Database = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

export function seedDatabase() {
  const adminExists = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
  if (adminExists) return;

  const adminId = crypto.randomUUID();
  const pinHash = hashPin('0000');
  const cardNumber = generateCardNumber();

  db.prepare(`
    INSERT INTO users (id, name, pin_hash, balance, is_admin, card_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(adminId, 'Адміністратор', pinHash, 0, 1, cardNumber);

  console.log('Admin user created with PIN: 0000');
}

function generateCardNumber(): string {
  return Math.random().toString().slice(2, 6);
}

// Initialize on import
initDatabase();
seedDatabase();

export default db;
