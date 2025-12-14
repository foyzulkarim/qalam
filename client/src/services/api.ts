import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  SurahsListResponse,
  SurahResponse,
  VerseResponse,
  EvaluateRequest,
  EvaluateResponse,
  ProgressResponse,
  HistoryResponse,
  VerseHistoryResponse,
  SurahProgressResponse,
  NextVerseResponse,
  UserUpdateResponse,
  PasswordChangeResponse,
  ApiError,
  User,
} from '@qalam/shared';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null): void {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new ApiRequestError(
        error.error.message,
        error.error.code,
        response.status
      );
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  async updateProfile(data: { name?: string; preferredTranslation?: string }): Promise<UserUpdateResponse> {
    return this.request<UserUpdateResponse>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<PasswordChangeResponse> {
    return this.request<PasswordChangeResponse>('/auth/me/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Surahs endpoints
  async getSurahs(): Promise<SurahsListResponse> {
    return this.request<SurahsListResponse>('/surahs');
  }

  async getSurah(surahId: number): Promise<SurahResponse> {
    return this.request<SurahResponse>(`/surahs/${surahId}`);
  }

  async getVerse(surahId: number, verseNumber: number): Promise<VerseResponse> {
    return this.request<VerseResponse>(`/surahs/${surahId}/verses/${verseNumber}`);
  }

  // Evaluate endpoint
  async evaluate(data: EvaluateRequest): Promise<EvaluateResponse> {
    return this.request<EvaluateResponse>('/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Progress endpoints
  async getProgress(): Promise<ProgressResponse> {
    return this.request<ProgressResponse>('/progress');
  }

  async getHistory(limit = 20): Promise<HistoryResponse> {
    return this.request<HistoryResponse>(`/progress/history?limit=${limit}`);
  }

  async getNextVerse(): Promise<NextVerseResponse> {
    return this.request<NextVerseResponse>('/progress/next-verse');
  }

  async getVerseHistory(verseId: string): Promise<VerseHistoryResponse> {
    return this.request<VerseHistoryResponse>(`/progress/verses/${encodeURIComponent(verseId)}`);
  }

  async getSurahProgress(surahId: number): Promise<SurahProgressResponse> {
    return this.request<SurahProgressResponse>(`/progress/surahs/${surahId}`);
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const api = new ApiClient();
