'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/resume/file-upload';
import { useResumes } from '@/hooks/useResumes';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatFileSize, getStatusColor, getScoreColor } from '@/lib/utils';
import { 
  FileText, 
  Download, 
  Trash2, 
  BarChart3, 
  Calendar,
  Search,
  Filter,
  Upload,
  Eye,
  Edit
} from 'lucide-react';
import Link from 'next/link';

export default function ResumesPage() {
  const { resumes, loading, uploadProgress, fetchResumes, uploadResume, deleteResume } = useResumes();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadResume(file, file.name.replace(/\.[^/.]+$/, ''));
      setShowUpload(false);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resumeId: string, resumeTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${resumeTitle}"?`)) {
      await deleteResume(resumeId);
    }
  };

  const handleDownload = (resume: any) => {
    if (resume.file_name) {
      const { data } = supabase.storage.from('resumes').getPublicUrl(resume.file_name);
      if (data.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
    }
  };

  // Filter resumes based on search term and status
  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || resume.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getScoreDisplay = (score?: number) => {
    if (!score) return { text: 'Not analyzed', color: 'text-gray-500' };
    
    return {
      text: `${score}%`,
      color: getScoreColor(score)
    };
  };

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No resumes uploaded yet
      </h3>
      <p className="text-gray-500 mb-6">
        Upload your first resume to get started with ATS optimization
      </p>
      <Button onClick={() => setShowUpload(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Upload Resume
      </Button>
    </div>
  );

  const ResumeCard = ({ resume }: { resume: any }) => {
    const scoreDisplay = getScoreDisplay(resume.ats_score);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold mb-1">
                {resume.title}
              </CardTitle>
              <CardDescription className="text-sm">
                Version {resume.version} • {formatDate(resume.created_at)}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={getStatusColor(resume.status)}
              >
                {resume.status.charAt(0).toUpperCase() + resume.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* ATS Score Display */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">ATS Score:</span>
            </div>
            <div className={`text-lg font-bold ${scoreDisplay.color}`}>
              {scoreDisplay.text}
            </div>
          </div>
          
          {/* File Info */}
          {resume.file_path && (
            <div className="text-xs text-gray-500 mb-4">
              File available for download
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Link href={`/dashboard/analysis?resume=${resume.id}`}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analyze
                </Button>
              </Link>
              
              {resume.file_path && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(resume)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(resume.id, resume.title)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resumes</h2>
          <p className="text-muted-foreground">
            Upload and manage your resumes for ATS optimization
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Resume
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload Resume</CardTitle>
                <CardDescription>
                  Upload a PDF, DOC, DOCX, or TXT file to get started
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUpload(false)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUpload={handleFileUpload}
              uploading={uploading}
              uploadProgress={uploadProgress}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {resumes.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Search resumes</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by title..."
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumes Grid */}
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
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredResumes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      ) : resumes.length > 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No resumes found
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
