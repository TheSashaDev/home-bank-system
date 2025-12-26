import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'data/bank.db');
const db = new Database(dbPath);

const SECRET = 'homebank-2024';

function generateChecksum(id) {
  const str = id + SECRET;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

const admin = db.prepare('SELECT id, name FROM users WHERE is_admin = 1').get();

if (!admin) {
  console.log('Admin user not found!');
  process.exit(1);
}

const sig = generateChecksum(admin.id);
const qrData = JSON.stringify({ v: 1, id: admin.id, sig });

console.log('\nAdmin User:', admin.name);
console.log('Admin ID:', admin.id);
console.log('\nQR Code Data:');
console.log(qrData);
