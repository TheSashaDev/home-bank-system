// User types
export interface User {
  id: string;
  name: string;
  balance: number; // в копійках
  isAdmin: boolean;
  isBlocked: boolean;
  blockedUntil: number | null;
  failedAttempts: number;
  cardNumber: string; // останні 4 цифри
}

export interface UserRow {
  id: string;
  name: string;
  pin_hash: string;
  balance: number;
  is_admin: number;
  is_blocked: number;
  blocked_until: number | null;
  failed_attempts: number;
  card_number: string;
  created_at: number;
}

// Transaction types
export type TransactionType = 'transfer' | 'deposit' | 'withdrawal' | 'credit' | 'credit_payment' | 'savings_deposit' | 'savings_withdrawal' | 'interest';

export interface Transaction {
  id: string;
  fromUserId: string | null;
  toUserId: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  createdAt: number;
}

export interface TransactionRow {
  id: string;
  from_user_id: string | null;
  to_user_id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  created_at: number;
}

// Credit types
export type CreditStatus = 'active' | 'paid' | 'overdue';

export interface Credit {
  id: string;
  userId: string;
  amount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  status: CreditStatus;
  dueDate: number;
  createdAt: number;
}

export interface CreditRow {
  id: string;
  user_id: string;
  amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number;
  status: CreditStatus;
  due_date: number;
  created_at: number;
}

// Savings types
export interface Savings {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  lastInterestDate: number;
  createdAt: number;
}

export interface SavingsRow {
  id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  last_interest_date: number;
  created_at: number;
}

// Debt types
export type DebtStatus = 'pending' | 'accepted' | 'paid' | 'rejected';

export interface Debt {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  remainingAmount: number;
  description: string | null;
  status: DebtStatus;
  createdAt: number;
}

export interface DebtRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  remaining_amount: number;
  description: string | null;
  status: DebtStatus;
  created_at: number;
}

// API Request types
export interface LoginRequest {
  qrData: string;
  pin: string;
}

export interface TransferRequest {
  toUserId: string;
  amount: number;
  pin: string;
}

export interface DepositRequest {
  userId: string;
  amount: number;
}

export interface CreateUserRequest {
  name: string;
  pin: string;
  isAdmin?: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface TransferResponse {
  transactionId: string;
}

// Mappers
export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    balance: row.balance,
    isAdmin: row.is_admin === 1,
    isBlocked: row.is_blocked === 1,
    blockedUntil: row.blocked_until,
    failedAttempts: row.failed_attempts,
    cardNumber: row.card_number,
  };
}

export function mapTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    amount: row.amount,
    type: row.type,
    description: row.description,
    createdAt: row.created_at,
  };
}

export function mapCreditRow(row: CreditRow): Credit {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    remainingAmount: row.remaining_amount,
    interestRate: row.interest_rate,
    monthlyPayment: row.monthly_payment,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

export function mapSavingsRow(row: SavingsRow): Savings {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    interestRate: row.interest_rate,
    lastInterestDate: row.last_interest_date,
    createdAt: row.created_at,
  };
}

export function mapDebtRow(row: DebtRow): Debt {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    amount: row.amount,
    remainingAmount: row.remaining_amount,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Request types
export interface TakeCreditRequest {
  amount: number;
  months: number;
  pin: string;
}

export interface PayCreditRequest {
  creditId: string;
  amount: number;
  pin: string;
}

export interface SavingsDepositRequest {
  amount: number;
  pin: string;
}

export interface SavingsWithdrawRequest {
  amount: number;
  pin: string;
}

export interface CreateDebtRequest {
  toUserId: string;
  amount: number;
  description?: string;
}

export interface PayDebtRequest {
  debtId: string;
  amount: number;
  pin: string;
}
