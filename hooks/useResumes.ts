'use client';

import { useState, useCallback } from 'react';
import { Resume } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useResumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const fetchResumes = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching resumes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const uploadResume = useCallback(async (file: File, title?: string) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to upload a resume.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: title || file.name,
          file_name: fileName,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Resume uploaded successfully.',
      });

      await fetchResumes();

    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  }, [user, toast, fetchResumes]);

  const deleteResume = useCallback(async (resumeId: string) => {
    try {
      const resumeToDelete = resumes.find(r => r.id === resumeId);
      if (!resumeToDelete) throw new Error("Resume not found.");

      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resumeToDelete.file_name]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Resume deleted successfully.',
      });

      setResumes(prev => prev.filter(r => r.id !== resumeId));
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [resumes, toast]);

  return {
    resumes,
    loading,
    uploading,
    uploadProgress,
    fetchResumes,
    uploadResume,
    deleteResume,
  };
}
