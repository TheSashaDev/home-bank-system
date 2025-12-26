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

  async blockUser(userId: string, blocked: boolean): Promise<ApiResponse<void>> {
    return this.request('/admin/block-user', {
      method: 'POST',
      body: JSON.stringify({ userId, blocked }),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.request(`/admin/user/${userId}`, { method: 'DELETE' });
  }

  async resetPin(userId: string, newPin: string): Promise<ApiResponse<void>> {
    return this.request('/admin/reset-pin', {
      method: 'POST',
      body: JSON.stringify({ userId, newPin }),
    });
  }

  async adminWithdraw(userId: string, amount: number): Promise<ApiResponse<{ transactionId: string; newBalance: number }>> {
    return this.request('/admin/withdraw', {
      method: 'POST',
      body: JSON.stringify({ userId, amount }),
    });
  }

  async getStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalBalance: number;
    totalCredits: number;
    totalSavings: number;
    totalDebts: number;
    txToday: number;
  }>> {
    return this.request('/admin/stats');
  }

  async getAllTransactions(): Promise<ApiResponse<any[]>> {
    return this.request('/admin/transactions');
  }

  async getAllCredits(): Promise<ApiResponse<any[]>> {
    return this.request('/admin/credits');
  }

  async getAllDebts(): Promise<ApiResponse<any[]>> {
    return this.request('/admin/debts');
  }

  async forgiveCredit(creditId: string): Promise<ApiResponse<void>> {
    return this.request('/admin/forgive-credit', {
      method: 'POST',
      body: JSON.stringify({ creditId }),
    });
  }

  async forgiveDebt(debtId: string): Promise<ApiResponse<void>> {
    return this.request('/admin/forgive-debt', {
      method: 'POST',
      body: JSON.stringify({ debtId }),
    });
  }

  // Credits
  async takeCredit(amount: number, weeks: number, pin: string): Promise<ApiResponse<{
    creditId: string;
    weeklyPayment: number;
    totalAmount: number;
  }>> {
    return this.request('/credits/take', {
      method: 'POST',
      body: JSON.stringify({ amount, weeks, pin }),
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

  async respondToDebt(debtId: string, accept: boolean, pin: string, interestRate?: number): Promise<ApiResponse<Debt>> {
    return this.request('/debts/respond', {
      method: 'POST',
      body: JSON.stringify({ debtId, accept, pin, interestRate }),
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

  // Withdrawals
  async createWithdrawal(amount: number, cardNumber: string, pin: string): Promise<ApiResponse<{ id: string }>> {
    return this.request('/withdrawals/create', {
      method: 'POST',
      body: JSON.stringify({ amount, cardNumber, pin }),
    });
  }

  async getMyWithdrawals(): Promise<ApiResponse<any[]>> {
    return this.request('/withdrawals/my');
  }

  async getAllWithdrawals(): Promise<ApiResponse<any[]>> {
    return this.request('/withdrawals/all');
  }

  async processWithdrawal(requestId: string, approve: boolean, comment?: string): Promise<ApiResponse<void>> {
    return this.request('/withdrawals/process', {
      method: 'POST',
      body: JSON.stringify({ requestId, approve, comment }),
    });
  }
}

export const api = new ApiClient();
