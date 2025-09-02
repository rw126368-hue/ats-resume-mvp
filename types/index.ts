export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  content: any;
  file_path?: string;
  status: 'draft' | 'published' | 'archived';
  ats_score?: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: any;
  category?: string;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements?: any;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  remote_allowed: boolean;
  source?: string;
  external_id?: string;
  scraped_at: string;
  is_active: boolean;
}

export interface GeneratedResume {
  id: string;
  user_id: string;
  job_posting_id?: string;
  original_resume_id?: string;
  generated_content: any;
  ats_score?: number;
  optimization_notes?: string;
  status: 'generated' | 'approved' | 'rejected';
  created_at: string;
}

export interface AuditReport {
  id: string;
  resume_id: string;
  audit_type: string;
  accuracy_score?: number;
  completeness_score?: number;
  relevance_score?: number;
  issues?: any;
  recommendations?: any;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  resume_id: string;
  extracted_skills?: any;
  suggested_titles?: any;
  experience_summary?: any;
  education_analysis?: any;
  confidence_score?: number;
  analysis_metadata?: any;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  email_sent: boolean;
  read_at?: string;
  created_at: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  config: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  results?: any;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  resume_id: string;
  job_posting_id: string;
  company_name: string;
  position_title: string;
  status: 'pending' | 'applied' | 'interviewing' | 'rejected' | 'accepted';
  applied_date: string;
  notes?: string;
  match_score?: number;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UploadResumeRequest {
  file: File;
  title?: string;
}

export interface AnalyzeResumeRequest {
  resume_id: string;
  job_description?: string;
}

export interface CreateJobApplicationRequest {
  resume_id: string;
  company_name: string;
  position_title: string;
  job_description?: string;
  status?: string;
  notes?: string;
}
