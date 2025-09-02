const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://yiezeelqulecqgdpeuii.supabase.co/functions/v1';

// API Response types
interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  message?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      (defaultHeaders as any)['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/auth-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/auth-register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Resume management endpoints
  async uploadResume(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('resume', file);

    const token = localStorage.getItem('auth_token');
    return this.makeRequest<ApiResponse>('/resume-management', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        // Don't set Content-Type for FormData, let browser set it
      },
      body: formData,
    });
  }

  async getResumes(): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/resume-management', {
      method: 'GET',
    });
  }

  async deleteResume(resumeId: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/resume-management', {
      method: 'DELETE',
      body: JSON.stringify({ resumeId }),
    });
  }

  // AI Analysis endpoints
  async analyzeResume(resumeId: string, jobDescription?: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/ai-analysis', {
      method: 'POST',
      body: JSON.stringify({ resumeId, jobDescription }),
    });
  }

  async getAnalysisHistory(): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/ai-analysis', {
      method: 'GET',
    });
  }

  // Job Applications endpoints
  async createJobApplication(data: {
    jobTitle: string;
    company: string;
    jobUrl?: string;
    resumeId: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/job-applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getJobApplications(): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/job-applications', {
      method: 'GET',
    });
  }

  async updateJobApplicationStatus(
    applicationId: string,
    status: string
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/job-applications', {
      method: 'PUT',
      body: JSON.stringify({ applicationId, status }),
    });
  }

  // Email notifications endpoint
  async sendNotification(data: {
    type: string;
    subject: string;
    message: string;
  }): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/email-notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export const authService = apiService;