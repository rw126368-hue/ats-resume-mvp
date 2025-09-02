import { jwtDecode } from 'jwt-decode';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types';
import { apiClient } from '@/lib/api/client';

interface JWTPayload {
  user_id: string;
  email: string;
  full_name?: string;
  role?: string;
  exp: number;
  iat: number;
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      this.clearAuth();
      return false;
    }
  }

  // Get stored token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  // Get current user
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        this.clearAuth();
        return null;
      }
    }

    // Try to get user from token
    const token = this.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        const user: User = {
          id: decoded.user_id,
          email: decoded.email,
          full_name: decoded.full_name,
          role: decoded.role,
          created_at: '',
          updated_at: ''
        };
        this.setUser(user);
        return user;
      } catch {
        this.clearAuth();
        return null;
      }
    }

    return null;
  }

  // Store authentication data
  private setAuth(token: string, user: User): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Store user data
  private setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear authentication data
  clearAuth(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.login(credentials.email, credentials.password);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const { user, token } = response.data;
      this.setAuth(token, user);
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  // Register user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.register(
        userData.email,
        userData.password,
        userData.full_name
      );
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const { user, token } = response.data;
      this.setAuth(token, user);
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    this.clearAuth();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }

  // Refresh token (if needed)
  async refreshToken(): Promise<boolean> {
    // Implementation depends on backend refresh token endpoint
    // For now, just check if current token is valid
    return this.isAuthenticated();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
