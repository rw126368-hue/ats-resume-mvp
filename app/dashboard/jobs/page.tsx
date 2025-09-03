'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import { useJobApplications } from '@/hooks/useJobApplications';
import { useResumes } from '@/hooks/useResumes';
import { useToast } from '@/hooks/use-toast';
import { formatDate, getStatusColor } from '@/lib/utils';
import {
  Briefcase,
  Plus,
  Building,
  Calendar,
  FileText,
  BarChart3,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Target,
  Sparkles,
  ExternalLink,
  Mail
} from 'lucide-react';

interface JobApplicationFormData {
  resume_id: string;
  company_name: string;
  position_title: string;
  job_description: string;
  notes: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
];

export default function JobApplicationsPage() {
  const { applications, loading, fetchApplications, createApplication, updateApplication, getApplicationStats } = useJobApplications();
  const {
    resumes,
    jobs,
    emailNotifications,
    autoApplications,
    emailMonitoring,
    dbUsage,
    fetchResumes,
    matchJobsWithResume,
    fetchJobs,
    saveJob,
    deleteJob,
    checkEmailsForJobs,
    processJobFromEmail,
    autoApplyToJobs,
    startEmailMonitoring,
    stopEmailMonitoring,
    monitorDatabaseUsage,
    cleanupOldData,
    deduplicateJobs,
    createDataBackup,
    sendGmailBackup,
    performFullBackup
  } = useResumes();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [formData, setFormData] = useState<JobApplicationFormData>({
    resume_id: '',
    company_name: '',
    position_title: '',
    job_description: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  // Job search and matching
  const [showJobSearch, setShowJobSearch] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResumeForMatching, setSelectedResumeForMatching] = useState('');
  const [matchingResults, setMatchingResults] = useState<any>(null);
  const [matching, setMatching] = useState(false);

  // Job management
  const [showSaveJob, setShowSaveJob] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    salary_range: '',
    job_type: 'full-time',
    application_url: ''
  });
  const [savingJob, setSavingJob] = useState(false);

  useEffect(() => {
    fetchApplications();
    if (resumes.length === 0) {
      fetchResumes();
    }
  }, [fetchApplications, fetchResumes, resumes.length]);

  const stats = getApplicationStats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.resume_id || !formData.company_name || !formData.position_title) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    
    try {
      await createApplication({
        resume_id: formData.resume_id,
        company_name: formData.company_name,
        position_title: formData.position_title,
        job_description: formData.job_description,
        notes: formData.notes,
      });
      
      // Reset form
      setFormData({
        resume_id: '',
        company_name: '',
        position_title: '',
        job_description: '',
        notes: ''
      });
      setShowForm(false);
      
      toast({
        title: 'Application Added',
        description: 'Job application has been successfully tracked',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await updateApplication(applicationId, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: 'Application status has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJobMatch = async () => {
    if (!selectedResumeForMatching || !jobDescription.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a resume and enter a job description',
        variant: 'destructive',
      });
      return;
    }

    setMatching(true);
    try {
      const results = await matchJobsWithResume(selectedResumeForMatching, jobDescription);
      setMatchingResults(results);
      toast({
        title: 'Match Analysis Complete',
        description: `Your resume matches ${results.match_score}% with this job`,
      });
    } catch (error: any) {
      toast({
        title: 'Matching Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setMatching(false);
    }
  };

  const handleSaveJob = async () => {
    if (!jobFormData.title || !jobFormData.company || !jobFormData.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the required fields (title, company, description)',
        variant: 'destructive',
      });
      return;
    }

    setSavingJob(true);
    try {
      await saveJob(jobFormData);
      setJobFormData({
        title: '',
        company: '',
        description: '',
        requirements: '',
        location: '',
        salary_range: '',
        job_type: 'full-time',
        application_url: ''
      });
      setShowSaveJob(false);
    } catch (error: any) {
      // Error is already handled in the hook
    } finally {
      setSavingJob(false);
    }
  };

  const handleJobFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJobFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatCard = ({ title, value, description, icon: Icon }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const ApplicationCard = ({ application }: { application: any }) => {
    const resume = resumes.find(r => r.id === application.resume_id);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold mb-1">
                {application.position_title}
              </CardTitle>
              <CardDescription className="flex items-center text-sm">
                <Building className="mr-1 h-3 w-3" />
                {application.company_name}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(application.status)}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Application Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              Applied: {formatDate(application.applied_date)}
            </div>
            {resume && (
              <div className="flex items-center text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" />
                Resume: {resume.title}
              </div>
            )}
          </div>
          
          {application.match_score && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-sm font-medium">Match Score:</span>
              <Badge variant="outline" className="text-blue-700">
                {application.match_score}%
              </Badge>
            </div>
          )}
          
          {application.notes && (
            <div className="text-sm text-muted-foreground">
              <strong>Notes:</strong> {application.notes}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <select
                value={application.status}
                onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                className="text-xs px-2 py-1 border rounded"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ApplicationForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Add Job Application</CardTitle>
        <CardDescription>
          Track a new job application
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Enter company name"
                required
              />
            </div>
            <div>
              <Label htmlFor="position_title">Position Title *</Label>
              <Input
                id="position_title"
                name="position_title"
                value={formData.position_title}
                onChange={handleChange}
                placeholder="Enter position title"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="resume_id">Resume Used *</Label>
            <select
              id="resume_id"
              name="resume_id"
              value={formData.resume_id}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a resume...</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.title}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="job_description">Job Description</Label>
            <Textarea
              id="job_description"
              name="job_description"
              value={formData.job_description}
              onChange={handleChange}
              placeholder="Paste the job description here..."
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes or comments..."
              rows={3}
            />
          </div>
        </CardContent>
        
        <CardContent className="flex items-center space-x-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Application'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </CardContent>
      </form>
    </Card>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Briefcase className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No job applications tracked
      </h3>
      <p className="text-gray-500 mb-6">
        Start tracking your job applications to monitor your progress
      </p>
      <Button onClick={() => setShowForm(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add First Application
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Database Usage Monitor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Database Usage (Supabase Free Tier: 50MB)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={monitorDatabaseUsage}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  const { data, error } = await supabase.from('job_postings').select('count', { count: 'exact', head: true });
                  if (error) {
                    alert(`Database Test Failed: ${error.message}\n\nPlease check:\n1. job_postings table exists\n2. RLS policies are set up\n3. User has proper permissions`);
                  } else {
                    alert(`✅ Database Connection Successful!\nFound ${data} job postings`);
                  }
                } catch (err: any) {
                  alert(`❌ Database Test Failed: ${err.message}`);
                }
              }}>
                Test DB
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Used: {(dbUsage.used / (1024 * 1024)).toFixed(2)} MB</span>
              <span className="text-sm font-medium">Limit: {(dbUsage.limit / (1024 * 1024)).toFixed(0)} MB</span>
            </div>
            <Progress
              value={(dbUsage.used / dbUsage.limit) * 100}
              className={`w-full ${((dbUsage.used / dbUsage.limit) * 100) > 80 ? 'bg-red-100' : 'bg-green-100'}`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{((dbUsage.used / dbUsage.limit) * 100).toFixed(1)}% used</span>
              <span>{((dbUsage.limit - dbUsage.used) / (1024 * 1024)).toFixed(2)} MB remaining</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cleanupOldData}>
                Clean Old Data
              </Button>
              <Button variant="outline" size="sm" onClick={deduplicateJobs}>
                Remove Duplicates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gmail Backup System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Gmail Backup System
          </CardTitle>
          <CardDescription>
            Automatic data backup to your Gmail for redundancy and 50MB limit management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Backup Email</p>
                <p className="text-xs text-muted-foreground">
                  {process.env.USER_GMAIL_ADDRESS || 'Not configured'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Auto: Weekly</span>
                <Button variant="outline" size="sm" onClick={performFullBackup}>
                  Backup Now
                </Button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Gmail Setup Instructions:</h4>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1. Go to Gmail → Settings → See all settings → Filters and Blocked Addresses</li>
                <li>2. Create a new filter for emails from: your-email@gmail.com</li>
                <li>3. Add subject filter: "ATS Resume Generator Backup"</li>
                <li>4. Choose action: Apply label "ATS-Backups" (create new label)</li>
                <li>5. Skip Inbox, Apply label</li>
              </ol>
            </div>

            <div className="text-xs text-muted-foreground">
              <p><strong>Benefits:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Data redundancy outside Supabase database</li>
                <li>Automatic weekly backups</li>
                <li>Prevents data loss if database reaches 50MB limit</li>
                <li>Easy restoration from Gmail archives</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Job Applications</h2>
          <p className="text-muted-foreground">
            Track and manage your job application progress
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Applications"
          value={stats.total}
          icon={Briefcase}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          description="Waiting to apply"
          icon={Calendar}
        />
        <StatCard
          title="Applied"
          value={stats.applied}
          description="Applications sent"
          icon={FileText}
        />
        <StatCard
          title="Interviewing"
          value={stats.interviewing}
          description="In progress"
          icon={BarChart3}
        />
        <StatCard
          title="Success Rate"
          value={stats.total > 0 ? Math.round(((stats.interviewing + stats.accepted) / stats.total) * 100) : 0 + '%'}
          description="Interviews + offers"
          icon={BarChart3}
        />
      </div>

      {/* Job Management */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Job Database</h3>
          <p className="text-sm text-muted-foreground">
            Save and manage job postings for future reference
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSaveJob(!showSaveJob)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            {showSaveJob ? 'Cancel' : 'Save Job Posting'}
          </Button>
          <Button onClick={() => setShowJobSearch(!showJobSearch)}>
            <Target className="mr-2 h-4 w-4" />
            {showJobSearch ? 'Hide Job Search' : 'Find Matching Jobs'}
          </Button>
        </div>
      </div>

      {/* Automated Job Processing */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Automated Job Processing</h3>
          <p className="text-sm text-muted-foreground">
            Monitor emails for job notifications and auto-apply to high matches
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={emailMonitoring ? stopEmailMonitoring : startEmailMonitoring}
            variant={emailMonitoring ? "destructive" : "default"}
          >
            {emailMonitoring ? 'Stop Monitoring' : 'Start Email Monitoring'}
          </Button>
          <Button onClick={checkEmailsForJobs} variant="outline">
            Check Emails Now
          </Button>
          <Button onClick={() => autoApplyToJobs(90)} variant="outline">
            Auto-Apply (90%+ Match)
          </Button>
        </div>
      </div>

      {/* Email Notifications */}
      {emailNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Notifications</CardTitle>
            <CardDescription>
              Job opportunities found in your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      From: {notification.from} • {notification.received_date.toLocaleDateString()}
                    </p>
                    {notification.job_title && (
                      <p className="text-xs text-blue-600">
                        {notification.job_title} at {notification.company_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {notification.processed ? (
                      <Badge variant="secondary">Processed</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => processJobFromEmail(notification)}
                      >
                        Process Job
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-Application Results */}
      {autoApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Auto-Application Results</CardTitle>
            <CardDescription>
              Jobs automatically applied to based on resume matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {autoApplications.map((result, index) => {
                const job = jobs.find(j => j.id === result.job_id);
                const resume = resumes.find(r => r.id === result.resume_id);
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {job?.title} at {job?.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied with: {resume?.title}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-green-600">
                        {result.match_score}% match
                      </Badge>
                      {result.applied ? (
                        <Badge variant="secondary">Applied</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {showSaveJob && (
        <Card>
          <CardHeader>
            <CardTitle>Save Job Posting</CardTitle>
            <CardDescription>
              Add a job posting to your database for future reference and matching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="job-title">Job Title *</Label>
                <Input
                  id="job-title"
                  name="title"
                  value={jobFormData.title}
                  onChange={handleJobFormChange}
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>
              <div>
                <Label htmlFor="job-company">Company *</Label>
                <Input
                  id="job-company"
                  name="company"
                  value={jobFormData.company}
                  onChange={handleJobFormChange}
                  placeholder="e.g. Google"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="job-description">Job Description *</Label>
              <Textarea
                id="job-description"
                name="description"
                value={jobFormData.description}
                onChange={handleJobFormChange}
                placeholder="Paste the full job description here..."
                rows={6}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="job-requirements">Requirements</Label>
                <Textarea
                  id="job-requirements"
                  name="requirements"
                  value={jobFormData.requirements}
                  onChange={handleJobFormChange}
                  placeholder="Key requirements and qualifications..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="job-location">Location</Label>
                <Input
                  id="job-location"
                  name="location"
                  value={jobFormData.location}
                  onChange={handleJobFormChange}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="job-salary">Salary Range</Label>
                <Input
                  id="job-salary"
                  name="salary_range"
                  value={jobFormData.salary_range}
                  onChange={handleJobFormChange}
                  placeholder="e.g. $120k - $150k"
                />
              </div>
              <div>
                <Label htmlFor="job-type">Job Type</Label>
                <select
                  id="job-type"
                  name="job_type"
                  value={jobFormData.job_type}
                  onChange={handleJobFormChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <Label htmlFor="application-url">Application URL</Label>
                <Input
                  id="application-url"
                  name="application_url"
                  value={jobFormData.application_url}
                  onChange={handleJobFormChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveJob} disabled={savingJob}>
                {savingJob ? (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Save Job
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowSaveJob(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showJobSearch && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Job Description
              </CardTitle>
              <CardDescription>
                Paste a job description to match with your resume
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resume-match">Select Resume</Label>
                <select
                  id="resume-match"
                  value={selectedResumeForMatching}
                  onChange={(e) => setSelectedResumeForMatching(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Choose a resume...</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={8}
                />
              </div>

              <Button
                onClick={handleJobMatch}
                disabled={matching || !selectedResumeForMatching || !jobDescription.trim()}
                className="w-full"
              >
                {matching ? (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Match...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Analyze Job Match
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {matchingResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Match Results
                </CardTitle>
                <CardDescription>
                  How well your resume matches this job
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {matchingResults.match_score}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Resume-Job Match Score
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Matched Keywords ({matchingResults.matched_keywords.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {matchingResults.matched_keywords.slice(0, 10).map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Missing Keywords ({matchingResults.missing_keywords.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {matchingResults.missing_keywords.slice(0, 10).map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {matchingResults.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start">
                        <span className="mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    setFormData({
                      resume_id: selectedResumeForMatching,
                      company_name: '',
                      position_title: '',
                      job_description: jobDescription,
                      notes: `Match score: ${matchingResults.match_score}%`
                    });
                    setShowForm(true);
                    setShowJobSearch(false);
                  }}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Track This Application
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Application Form */}
      {showForm && <ApplicationForm />}

      {/* Filters */}
      {applications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Search applications</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by company or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Filter by status</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredApplications.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No applications found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters
          </p>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
