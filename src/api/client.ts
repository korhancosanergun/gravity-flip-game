export interface UserInfo {
  id: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  levelsCompleted: number;
  totalFlips: number;
  completedAt: string;
}

const API_BASE  = '/api';
const TOKEN_KEY = 'gf_token';
const USER_KEY  = 'gf_user';

export class ApiClient {
  private _token: string | null;

  constructor() {
    this._token = localStorage.getItem(TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return !!this._token;
  }

  get user(): UserInfo | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserInfo; } catch { return null; }
  }

  async register(username: string, password: string): Promise<AuthResponse> {
    return this._authRequest('register', username, password);
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    return this._authRequest('login', username, password);
  }

  async submitScore(levelsCompleted: number, totalFlips: number): Promise<void> {
    if (!this._token) return;
    try {
      await fetch(`${API_BASE}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this._token}`,
        },
        body: JSON.stringify({ levelsCompleted, totalFlips }),
      });
    } catch { /* best-effort, non-blocking */ }
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      if (!res.ok) return [];
      return res.json() as Promise<LeaderboardEntry[]>;
    } catch { return []; }
  }

  logout(): void {
    this._token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private async _authRequest(
    action: 'register' | 'login',
    username: string,
    password: string,
  ): Promise<AuthResponse> {
    const res  = await fetch(`${API_BASE}/auth/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data as { error?: string }).error ?? `${action} failed`);
    const auth = data as AuthResponse;
    this._token = auth.token;
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    return auth;
  }
}
