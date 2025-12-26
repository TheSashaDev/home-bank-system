// User types
export interface User {
  id: string;
  name: string;
  balance: number; // в копійках
  isAdmin: boolean;
  isBlocked: boolean;
  blockedUntil: number | null;
  failedAttempts: number;
  cardNumber: string;
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

// Savings types
export interface Savings {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  lastInterestDate: number;
  createdAt: number;
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
