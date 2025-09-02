import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://yiezeelqulecqgdpeuii.supabase.co/functions/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, redirect to login
          this.clearAuthToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private clearAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  // Auth endpoints
  async register(email: string, password: string, full_name?: string) {
    const response = await this.client.post('/auth-register', {
      email,
      password,
      full_name,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth-login', {
      email,
      password,
    });
    return response.data;
  }

  // Resume management
  async uploadResume(formData: FormData) {
    const response = await this.client.post('/resume-management', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getResumes() {
    const response = await this.client.get('/resume-management');
    return response.data;
  }

  async deleteResume(resumeId: string) {
    const response = await this.client.delete(`/resume-management?id=${resumeId}`);
    return response.data;
  }

  // AI Analysis
  async analyzeResume(resumeId: string, jobDescription?: string) {
    const response = await this.client.post('/ai-analysis', {
      resume_id: resumeId,
      job_description: jobDescription,
    });
    return response.data;
  }

  // Job Applications
  async createJobApplication(data: {
    resume_id: string;
    company_name: string;
    position_title: string;
    job_description?: string;
    status?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/job-applications', data);
    return response.data;
  }

  async getJobApplications() {
    const response = await this.client.get('/job-applications');
    return response.data;
  }

  async updateJobApplication(id: string, data: { status?: string; notes?: string }) {
    const response = await this.client.patch(`/job-applications?id=${id}`, data);
    return response.data;
  }

  // Notifications
  async sendNotification(data: {
    to: string;
    subject: string;
    template?: string;
    templateData?: any;
  }) {
    const response = await this.client.post('/email-notifications', data);
    return response.data;
  }

  // File download helper
  getFileUrl(filename: string): string {
    const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://yiezeelqulecqgdpeuii.supabase.co/storage/v1/object/public/resume-files';
    return `${storageUrl}/${filename}`;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
