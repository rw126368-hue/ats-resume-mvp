import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { supabase } from '@/lib/supabase/client';
// Note: Email libraries are imported dynamically to avoid Next.js build issues

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
    const { data } = supabase.storage.from('resume-files').getPublicUrl(filename);
    return data.publicUrl;
  }

  // Email integration methods (client-side simulation)
  async connectToEmail(): Promise<any> {
    // For client-side, we'll simulate email connection
    // In production, this would be handled by a server-side API
    console.log('Simulating email connection...');

    const config = {
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASS || '',
      host: process.env.EMAIL_HOST || '',
      port: parseInt(process.env.EMAIL_PORT || '993'),
      tls: process.env.EMAIL_TLS === 'true'
    };

    // Validate required environment variables
    if (!config.user || !config.password) {
      throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env.local');
    }

    // Simulate connection success
    return { config, connected: true };
  }

  async fetchJobEmails(connection: any): Promise<any[]> {
    try {
      await connection.openBox('INBOX');

      // Search for recent emails with job-related keywords
      const searchCriteria = [
        ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]], // Last 24 hours
        ['OR',
          ['SUBJECT', 'job'],
          ['SUBJECT', 'opportunity'],
          ['SUBJECT', 'position'],
          ['SUBJECT', 'hiring'],
          ['SUBJECT', 'career']
        ]
      ];

      const fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        markSeen: false
      };

      const messages = await connection.search(searchCriteria, fetchOptions);
      return messages;
    } catch (error) {
      console.error('Failed to fetch job emails:', error);
      throw error;
    }
  }

  async parseJobFromEmail(email: any): Promise<any> {
    try {
      const header = email.parts.find((part: any) => part.which === 'HEADER');
      const body = email.parts.find((part: any) => part.which === 'TEXT');

      const subject = header.body.subject?.[0] || '';
      const from = header.body.from?.[0] || '';
      const emailBody = body?.body || '';

      // Simple job extraction logic
      const jobTitle = this.extractJobTitle(subject, emailBody);
      const companyName = this.extractCompanyName(subject, emailBody);
      const jobDescription = this.extractJobDescription(emailBody);
      const applicationUrl = this.extractApplicationUrl(emailBody);

      return {
        id: email.attributes.uid.toString(),
        subject,
        from,
        body: emailBody,
        received_date: new Date(),
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDescription,
        application_url: applicationUrl,
        processed: false
      };
    } catch (error) {
      console.error('Failed to parse job from email:', error);
      throw error;
    }
  }

  private extractJobTitle(subject: string, body: string): string | undefined {
    // Look for common job title patterns
    const patterns = [
      /position[:\s]+([^\n\r]+)/i,
      /job[:\s]+([^\n\r]+)/i,
      /opening[:\s]+([^\n\r]+)/i,
      /role[:\s]+([^\n\r]+)/i
    ];

    for (const pattern of patterns) {
      const match = subject.match(pattern) || body.match(pattern);
      if (match) return match[1].trim();
    }

    return undefined;
  }

  private extractCompanyName(subject: string, body: string): string | undefined {
    // Look for company name patterns
    const patterns = [
      /at\s+([^\n\r,]+)/i,
      /with\s+([^\n\r,]+)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+hiring/i
    ];

    for (const pattern of patterns) {
      const match = subject.match(pattern) || body.match(pattern);
      if (match) return match[1].trim();
    }

    return undefined;
  }

  private extractJobDescription(body: string): string | undefined {
    // Extract text between common job description markers
    const patterns = [
      /description[:\s]*([\s\S]*?)(?:requirements|qualifications|apply|application)/i,
      /about\s+the\s+role[:\s]*([\s\S]*?)(?:requirements|qualifications|benefits)/i
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) return match[1].trim();
    }

    // Return first 500 characters as fallback
    return body.substring(0, 500);
  }

  private extractApplicationUrl(body: string): string | undefined {
    // Look for URLs that might be application links
    const urlPattern = /https?:\/\/[^\s]+(?:apply|application|job)[^\s]*/gi;
    const match = body.match(urlPattern);
    return match ? match[0] : undefined;
  }

  async sendApplicationEmail(job: any, resume: any, optimizedResume: any): Promise<void> {
    // For client-side, we'll simulate email sending
    // In production, this would be handled by a server-side API
    console.log('Simulating application email send:', {
      to: job.application_url || 'applications@company.com',
      subject: `Application for ${job.title} - ${resume.title}`,
      job,
      resume,
      optimizedResume
    });

    // Simulate successful send
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
