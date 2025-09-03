'use client';

import { useState, useCallback } from 'react';
import { JobApplication } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useJobApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching job applications',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createApplication = useCallback(async (data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>) => {
    if (!user) return;

    try {
      const { data: newApplication, error } = await supabase
        .from('job_applications')
        .insert({ ...data, user_id: user.id, status: 'pending' })
        .select()
        .single();
      
      if (error) throw error;

      setApplications(prev => [newApplication, ...prev]);

      toast({
        title: 'Success',
        description: 'Job application created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create job application',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user, toast]);

  const updateApplication = useCallback(async (
    id: string,
    data: Partial<JobApplication>
  ) => {
    try {
      const { data: updatedApplication, error } = await supabase
        .from('job_applications')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setApplications(prev =>
        prev.map(app => (app.id === id ? updatedApplication : app))
      );

      toast({
        title: 'Success',
        description: 'Job application updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job application',
        variant: 'destructive',
      });
    }
  }, [toast]);

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
    getApplicationStats,
  };
}
