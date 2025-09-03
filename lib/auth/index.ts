import { supabase } from '@/lib/supabase/client';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types';

class AuthService {
  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { user } = session;
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata.full_name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at || '',
    };
  }

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('Supabase login error:', error);
      throw new Error(error.message || 'Login failed');
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed: No user or session data');
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      full_name: data.user.user_metadata.full_name,
      role: data.user.role,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at || '',
    };

    return { user, token: data.session.access_token };
  }

  // Register user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('Registering user with data:', userData);
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
        },
      },
    });

    if (error) {
      console.error('Supabase registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }

    if (!data.user || !data.session) {
      throw new Error('Registration failed: No user or session data');
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      full_name: data.user.user_metadata.full_name,
      role: data.user.role,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at || '',
    };

    return { user, token: data.session.access_token };
  }

  // Logout user
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
