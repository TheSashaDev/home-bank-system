import Database from 'better-sqlite3';

const db = new Database('./data/bank.db');

// Удаляем старую таблицу transactions и создаём новую с правильным CHECK
db.exec(`
  -- Сохраняем данные
  CREATE TABLE IF NOT EXISTS transactions_backup AS SELECT * FROM transactions;
  
  -- Удаляем старую таблицу
  DROP TABLE IF EXISTS transactions;
  
  -- Создаём новую с расширенным CHECK
  CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    from_user_id TEXT,
    to_user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('transfer', 'deposit', 'withdrawal', 'credit', 'credit_payment', 'savings_deposit', 'savings_withdrawal', 'interest')),
    description TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  );
  
  -- Восстанавливаем данные
  INSERT INTO transactions SELECT * FROM transactions_backup;
  
  -- Удаляем бэкап
  DROP TABLE transactions_backup;
  
  -- Индексы
  CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
`);

console.log('Migration complete!');
db.close();
