import type {
  User,
  Transaction,
  Credit,
  Savings,
  Debt,
  LoginRequest,
  TransferRequest,
  DepositRequest,
  CreateUserRequest,
  ApiResponse,
  LoginResponse,
  TransferResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...options?.headers,
        },
      });

      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }

  // Auth
  async login(qrData: string, pin: string): Promise<ApiResponse<LoginResponse>> {
    const body: LoginRequest = { qrData, pin };
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  logout() {
    this.clearToken();
  }

  // Bank
  async getBalance(): Promise<ApiResponse<{ balance: number }>> {
    return this.request('/bank/balance');
  }

  async transfer(
    toUserId: string,
    amount: number,
    pin: string
  ): Promise<ApiResponse<TransferResponse>> {
    const body: TransferRequest = { toUserId, amount, pin };
    return this.request('/bank/transfer', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getHistory(): Promise<ApiResponse<Transaction[]>> {
    return this.request('/bank/history');
  }

  async getUsers(): Promise<ApiResponse<{ id: string; name: string; cardNumber: string }[]>> {
    return this.request('/bank/users');
  }

  // Admin
  async deposit(
    userId: string,
    amount: number
  ): Promise<ApiResponse<{ transactionId: string; newBalance: number }>> {
    const body: DepositRequest = { userId, amount };
    return this.request('/admin/deposit', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async createUser(
    name: string,
    pin: string,
    isAdmin = false
  ): Promise<ApiResponse<{ user: User; qrCode: string }>> {
    const body: CreateUserRequest = { name, pin, isAdmin };
    return this.request('/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/admin/users');
  }

  // Credits
  async takeCredit(amount: number, months: number, pin: string): Promise<ApiResponse<{
    credit: Credit;
    monthlyPayment: number;
    totalAmount: number;
  }>> {
    return this.request('/credits/take', {
      method: 'POST',
      body: JSON.stringify({ amount, months, pin }),
    });
  }

  async payCredit(creditId: string, amount: number, pin: string): Promise<ApiResponse<{
    remainingAmount: number;
    status: string;
    transactionId: string;
  }>> {
    return this.request('/credits/pay', {
      method: 'POST',
      body: JSON.stringify({ creditId, amount, pin }),
    });
  }

  async getMyCredits(): Promise<ApiResponse<Credit[]>> {
    return this.request('/credits/my');
  }

  // Savings
  async depositToSavings(amount: number, pin: string): Promise<ApiResponse<{
    savings: Savings;
    transactionId: string;
  }>> {
    return this.request('/savings/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, pin }),
    });
  }

  async withdrawFromSavings(amount: number, pin: string): Promise<ApiResponse<{
    savings: Savings;
    transactionId: string;
  }>> {
    return this.request('/savings/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, pin }),
    });
  }

  async getMySavings(): Promise<ApiResponse<Savings>> {
    return this.request('/savings/my');
  }

  // Debts
  async createDebt(toUserId: string, amount: number, description?: string): Promise<ApiResponse<Debt>> {
    return this.request('/debts/create', {
      method: 'POST',
      body: JSON.stringify({ toUserId, amount, description }),
    });
  }

  async respondToDebt(debtId: string, accept: boolean, pin: string): Promise<ApiResponse<Debt>> {
    return this.request('/debts/respond', {
      method: 'POST',
      body: JSON.stringify({ debtId, accept, pin }),
    });
  }

  async payDebt(debtId: string, amount: number, pin: string): Promise<ApiResponse<{
    remainingAmount: number;
    status: string;
    transactionId: string;
  }>> {
    return this.request('/debts/pay', {
      method: 'POST',
      body: JSON.stringify({ debtId, amount, pin }),
    });
  }

  async getMyDebts(): Promise<ApiResponse<Debt[]>> {
    return this.request('/debts/my');
  }

  async getDebtsToMe(): Promise<ApiResponse<Debt[]>> {
    return this.request('/debts/to-me');
  }

  async getDebtRequests(): Promise<ApiResponse<Debt[]>> {
    return this.request('/debts/requests');
  }
}

export const api = new ApiClient();
