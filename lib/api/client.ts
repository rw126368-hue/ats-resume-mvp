import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { supabase } from '@/lib/supabase/client';

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
      async (config) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
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
