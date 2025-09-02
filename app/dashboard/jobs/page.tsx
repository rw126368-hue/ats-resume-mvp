'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Trash2
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
  const { resumes, fetchResumes } = useResumes();
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
