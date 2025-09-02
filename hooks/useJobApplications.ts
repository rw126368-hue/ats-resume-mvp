'use client';

import { useState, useCallback } from 'react';
import { JobApplication } from '@/types';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';

export function useJobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getJobApplications();
      if (response.error) {
        throw new Error(response.error.message);
      }
      setApplications(response.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch job applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createApplication = useCallback(async (data: {
    resume_id: string;
    company_name: string;
    position_title: string;
    job_description?: string;
    notes?: string;
  }) => {
    try {
      const response = await apiClient.createJobApplication({
        ...data,
        status: 'pending',
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: 'Success',
        description: 'Job application created successfully',
      });

      // Refresh applications list
      await fetchApplications();
      
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create job application',
        variant: 'destructive',
      });
      throw error;
    }
  }, [fetchApplications, toast]);

  const updateApplication = useCallback(async (
    id: string,
    data: { status?: string; notes?: string }
  ) => {
    try {
      const response = await apiClient.updateJobApplication(id, data);
      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: 'Success',
        description: 'Job application updated successfully',
      });

      // Update local state
      setApplications(prev =>
        prev.map(app => (app.id === id ? { ...app, ...data } : app))
      );
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job application',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const getApplicationsByStatus = useCallback((status: string) => {
    return applications.filter(app => app.status === status);
  }, [applications]);

  const getApplicationStats = useCallback(() => {
    const stats = applications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: applications.length,
      pending: stats.pending || 0,
      applied: stats.applied || 0,
      interviewing: stats.interviewing || 0,
      rejected: stats.rejected || 0,
      accepted: stats.accepted || 0,
    };
  }, [applications]);

  return {
    applications,
    loading,
    fetchApplications,
    createApplication,
    updateApplication,
    getApplicationsByStatus,
    getApplicationStats,
  };
}
