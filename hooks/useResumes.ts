'use client';

import { useState, useCallback } from 'react';
import { Resume } from '@/types';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';

export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getResumes();
      if (response.error) {
        throw new Error(response.error.message);
      }
      setResumes(response.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch resumes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadResume = useCallback(async (file: File, title?: string) => {
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) {
        formData.append('title', title);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await apiClient.uploadResume(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: 'Success',
        description: 'Resume uploaded successfully',
      });

      // Refresh resumes list
      await fetchResumes();
      
      return response.data;
    } catch (error: any) {
      setUploadProgress(0);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload resume',
        variant: 'destructive',
      });
      throw error;
    }
  }, [fetchResumes, toast]);

  const deleteResume = useCallback(async (resumeId: string) => {
    try {
      const response = await apiClient.deleteResume(resumeId);
      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: 'Success',
        description: 'Resume deleted successfully',
      });

      // Remove from local state
      setResumes(prev => prev.filter(resume => resume.id !== resumeId));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete resume',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    resumes,
    loading,
    uploadProgress,
    fetchResumes,
    uploadResume,
    deleteResume,
  };
}
