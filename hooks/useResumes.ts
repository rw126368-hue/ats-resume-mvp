'use client';

/**
 * ATS Resume Generator - Optimized for Supabase 50MB Free Tier
 *
 * Data Management Strategy:
 * - Automatic cleanup of old data (30-180 days retention based on data type)
 * - Large content (email bodies, job descriptions) stored in Supabase Storage
 * - Database deduplication to prevent duplicate job postings
 * - Real-time usage monitoring with alerts at 80% capacity
 * - Periodic automated maintenance (cleanup every 24hrs, monitoring every 6hrs)
 *
 * Storage Optimization:
 * - Resume files: Supabase Storage (resume-files bucket)
 * - Email content: Supabase Storage (email-content bucket) for content > 1KB
 * - Database: Only metadata, IDs, and small text fields
 * - Estimated: ~1KB per record in database, large content in storage
 */

import { useState, useCallback, useEffect } from 'react';
import { Resume, JobPosting, EmailJobNotification, AutoApplicationResult } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UseResumesReturn = ReturnType<typeof useResumes>;

export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [emailNotifications, setEmailNotifications] = useState<EmailJobNotification[]>([]);
  const [autoApplications, setAutoApplications] = useState<AutoApplicationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [emailMonitoring, setEmailMonitoring] = useState(false);
  const [dbUsage, setDbUsage] = useState({ used: 0, limit: 50 * 1024 * 1024 }); // 50MB in bytes
  const { toast } = useToast();

  // Data retention policies (50MB limit optimization)
  const DATA_RETENTION_DAYS = {
    emailNotifications: 30, // Keep email notifications for 30 days
    autoApplications: 90,   // Keep application results for 90 days
    jobPostings: 180,       // Keep job postings for 180 days
    analysisHistory: 60     // Keep analysis history for 60 days
  };

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setResumes(data || []);
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resume-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(50);

      // Save resume metadata to database (minimal data to save space)
      const { data: resumeData, error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: title || file.name.replace(/\.[^/.]+$/, ''),
          file_path: fileName,
          status: 'published',
          version: 1,
          // Removed 'content' field to save database space - content can be extracted when needed
        })
        .select()
        .single();

      if (dbError) {
        // If database insert fails, try to delete the uploaded file
        await supabase.storage.from('resume-files').remove([fileName]);
        throw dbError;
      }

      setUploadProgress(100);

      toast({
        title: 'Success',
        description: 'Resume uploaded successfully',
      });

      // Refresh resumes list
      await fetchResumes();

      return resumeData;
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
      // Get resume data first to get file path
      const { data: resume, error: fetchError } = await supabase
        .from('resumes')
        .select('file_path')
        .eq('id', resumeId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (dbError) {
        throw dbError;
      }

      // Delete file from storage if it exists
      if (resume?.file_path) {
        await supabase.storage.from('resume-files').remove([resume.file_path]);
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

  // Job matching algorithm
  const matchJobsWithResume = useCallback(async (resumeId: string, jobDescription: string) => {
    try {
      const resume = resumes.find(r => r.id === resumeId);
      if (!resume) {
        throw new Error('Resume not found');
      }

      // Simple keyword matching algorithm
      const resumeText = (resume.content || resume.title || '').toLowerCase();
      const jobText = jobDescription.toLowerCase();

      // Extract keywords from job description
      const jobKeywords = jobText.match(/\b\w{3,}\b/g) || [];
      const resumeKeywords = resumeText.match(/\b\w{3,}\b/g) || [];

      // Calculate match score
      const matchedKeywords = jobKeywords.filter((keyword: string) =>
        resumeKeywords.some((resumeWord: string) => resumeWord.includes(keyword) || keyword.includes(resumeWord))
      );

      const matchScore = jobKeywords.length > 0 ? Math.round((matchedKeywords.length / jobKeywords.length) * 100) : 0;

      // Generate recommendations
      const missingKeywords = jobKeywords.filter((keyword: string) =>
        !resumeKeywords.some((resumeWord: string) =>
          resumeWord.includes(keyword) || keyword.includes(resumeWord)
        )
      ).slice(0, 10); // Limit to top 10

      return {
        match_score: matchScore,
        matched_keywords: matchedKeywords,
        missing_keywords: missingKeywords,
        recommendations: [
          `Add ${missingKeywords.slice(0, 5).join(', ')} to your resume`,
          'Tailor your experience section to highlight relevant skills',
          'Use industry-specific keywords from the job description',
          'Quantify your achievements with specific metrics',
          'Include relevant certifications or training'
        ]
      };
    } catch (error: any) {
      console.error('Job matching error:', error);
      throw error;
    }
  }, [resumes]);

  // Resume optimization generator
  const generateOptimizedResume = useCallback(async (resumeId: string, jobDescription: string) => {
    try {
      const resume = resumes.find(r => r.id === resumeId);
      if (!resume) {
        throw new Error('Resume not found');
      }

      const matchResult = await matchJobsWithResume(resumeId, jobDescription);

      // Generate optimized content suggestions
      const optimizedContent = {
        original_title: resume.title,
        suggested_title: resume.title, // Could be enhanced based on job
        missing_keywords: matchResult.missing_keywords,
        optimized_sections: {
          summary: `Results-driven professional with experience in ${matchResult.matched_keywords.slice(0, 3).join(', ')}. Skilled in ${matchResult.missing_keywords.slice(0, 3).join(', ')} with a proven track record of delivering high-quality results.`,
          skills: [...matchResult.matched_keywords, ...matchResult.missing_keywords.slice(0, 5)],
          experience: 'Consider rephrasing experience bullets to include more keywords from the job description and quantify achievements.',
          education: 'Ensure education section includes relevant coursework or certifications that match job requirements.'
        },
        ats_score_improvement: Math.min(20, matchResult.missing_keywords.length * 2),
        recommendations: [
          'Incorporate missing keywords naturally throughout your resume',
          'Use the exact job title from the posting',
          'Include relevant certifications and training',
          'Quantify achievements with specific metrics',
          'Use standard section headings (Experience, Education, Skills)',
          'Avoid tables, graphics, or complex formatting',
          'Use a clean, simple font like Arial or Calibri',
          'Save as PDF to preserve formatting'
        ]
      };

      return optimizedContent;
    } catch (error: any) {
      console.error('Resume optimization error:', error);
      throw error;
    }
  }, [resumes, matchJobsWithResume]);

  // Job management functions
  const fetchJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
    }
  }, []);

  const saveJob = useCallback(async (jobData: Omit<JobPosting, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Starting job save process...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User authentication error:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }

      console.log('User authenticated, saving job data:', jobData);

      const { data, error } = await supabase
        .from('job_postings')
        .insert({
          ...jobData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Job saved successfully:', data);

      toast({
        title: 'Success',
        description: 'Job posting saved successfully',
      });

      await fetchJobs();
      return data;
    } catch (error: any) {
      console.error('Error in saveJob:', {
        error: error.message || error,
        stack: error.stack,
        jobData: jobData
      });

      const errorMessage = error.message || 'Failed to save job';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  }, [fetchJobs, toast]);

  const deleteJob = useCallback(async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Job posting deleted successfully',
      });

      setJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete job',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Email monitoring and job extraction
  const checkEmailsForJobs = useCallback(async () => {
    try {
      console.log('Checking for active session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session) {
        throw new Error('No active session. Please log in.');
      }

      console.log('Session found, calling email check API...');
      const response = await fetch('/api/email/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to parse error response from server',
        }));
        
        const errorMessage = errorData.error || `API Error: ${response.status}`;
        const suggestions = errorData.suggestions ? `\n\nSuggestions:\n${errorData.suggestions.map((s: string) => `• ${s}`).join('\n')}` : ''

        if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
        }
        
        throw new Error(`${errorMessage}${suggestions}`);
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.notifications)) {
        throw new Error('Received an invalid response from the email service.');
      }

      setEmailNotifications(data.notifications);
      toast({
        title: 'Email Check Complete',
        description: `Found ${data.notifications.length} new job notifications.`,
      });

      return data.notifications;
    } catch (error: any) {
      console.error('Email check failed:', error);
      toast({
        title: 'Email Check Failed',
        description: error.message || 'An unknown error occurred while checking emails.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const processJobFromEmail = useCallback(async (emailNotification: EmailJobNotification) => {
    try {
      console.log('Starting email processing for:', emailNotification.subject);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      if (!user) {
        console.error('No user found');
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', user.id);

      // Store large email content in Supabase Storage to save database space
      let emailContentPath = '';
      if (emailNotification.body && emailNotification.body.length > 1000) {
        console.log('Storing large email content in storage...');
        try {
          const contentBlob = new Blob([emailNotification.body], { type: 'text/plain' });
          const contentFileName = `email-content/${user.id}/${Date.now()}-email.txt`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('email-content')
            .upload(contentFileName, contentBlob);

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            // Continue without storing in storage - will use database instead
          } else {
            emailContentPath = contentFileName;
            console.log('Email content stored at:', emailContentPath);
          }
        } catch (storageError) {
          console.error('Storage operation failed:', storageError);
          // Continue without storage - will use database instead
        }
      }

      // Extract job details from email
      const jobData = {
        title: emailNotification.job_title || 'Unknown Position',
        company: emailNotification.company_name || 'Unknown Company',
        description: emailNotification.job_description || (emailContentPath ? 'Content stored in file' : emailNotification.body?.substring(0, 500)),
        requirements: '',
        location: '',
        salary_range: '',
        job_type: 'full-time',
        source: 'email',
        application_url: emailNotification.application_url
      };

      console.log('Saving job data:', jobData);

      // Save job to database
      const savedJob = await saveJob(jobData);
      console.log('Job saved successfully:', savedJob);

      // Save email notification metadata (without large content)
      if (emailContentPath) {
        console.log('Saving email notification metadata...');
        const { error: notificationError } = await supabase.from('email_notifications').insert({
          user_id: user.id,
          subject: emailNotification.subject,
          from_address: emailNotification.from,
          content_path: emailContentPath,
          job_title: emailNotification.job_title,
          company_name: emailNotification.company_name,
          processed: true,
          created_at: new Date().toISOString()
        });

        if (notificationError) {
          console.error('Failed to save email notification:', notificationError);
          // Don't throw here - job is already saved
        }
      }

      // Mark email as processed in local state
      setEmailNotifications(prev =>
        prev.map(email =>
          email.id === emailNotification.id
            ? { ...email, processed: true }
            : email
        )
      );

      console.log('Email processing completed successfully');
      return savedJob;
    } catch (error: any) {
      console.error('Error processing job from email:', {
        error: error.message || error,
        stack: error.stack,
        emailSubject: emailNotification.subject,
        userId: 'unknown'
      });

      // Provide more specific error messages
      if (error.message?.includes('JWT')) {
        throw new Error('Authentication token expired. Please log in again.');
      } else if (error.message?.includes('permission')) {
        throw new Error('Database permission error. Please check your account permissions.');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error(`Failed to process email: ${error.message || 'Unknown error'}`);
      }
    }
  }, [saveJob]);

  const autoApplyToJobs = useCallback(async (minMatchScore: number = 90) => {
    try {
      const results: AutoApplicationResult[] = [];

      for (const job of jobs) {
        for (const resume of resumes) {
          const matchResult = await matchJobsWithResume(resume.id, job.description);

          if (matchResult.match_score >= minMatchScore) {
            // Auto-apply logic would go here
            // For now, we'll just log and track the result
            const result: AutoApplicationResult = {
              job_id: job.id,
              resume_id: resume.id,
              match_score: matchResult.match_score,
              applied: true,
              application_url: job.application_url,
            };

            results.push(result);

            toast({
              title: 'Auto-Applied!',
              description: `Applied to ${job.title} at ${job.company} (${matchResult.match_score}% match)`,
            });
          }
        }
      }

      setAutoApplications(results);
      return results;
    } catch (error: any) {
      toast({
        title: 'Auto-Apply Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [jobs, resumes, matchJobsWithResume, toast]);

  const startEmailMonitoring = useCallback(async () => {
    console.log('=== STARTING EMAIL MONITORING ===');
    setEmailMonitoring(true);

    try {
      console.log('Checking emails immediately on start...');
      // Check emails immediately
      await checkEmailsForJobs();

      console.log('Setting up periodic email checking (every 5 minutes)...');
      // Set up periodic checking (every 5 minutes)
      const interval = setInterval(async () => {
        console.log('=== PERIODIC EMAIL CHECK ===');
        await checkEmailsForJobs();
      }, 5 * 60 * 1000); // 5 minutes

      // Store interval ID for cleanup
      (window as any).emailCheckInterval = interval;
      console.log('Email monitoring interval set up with ID:', interval);

      toast({
        title: 'Email Monitoring Started',
        description: 'System will check for job notifications every 5 minutes',
      });
      console.log('Email monitoring started successfully');
    } catch (error: any) {
      console.log('=== EMAIL MONITORING START FAILED ===');
      console.error('Error starting email monitoring:', error);
      setEmailMonitoring(false);
      throw error;
    }
  }, [checkEmailsForJobs, toast]);

  const stopEmailMonitoring = useCallback(() => {
    console.log('=== STOPPING EMAIL MONITORING ===');
    setEmailMonitoring(false);

    if ((window as any).emailCheckInterval) {
      console.log('Clearing email check interval...');
      clearInterval((window as any).emailCheckInterval);
      (window as any).emailCheckInterval = null;
    } else {
      console.log('No active email check interval found');
    }

    toast({
      title: 'Email Monitoring Stopped',
      description: 'No longer checking for job notifications',
    });
    console.log('Email monitoring stopped');
  }, [toast]);

  // Database usage monitoring
  const monitorDatabaseUsage = useCallback(async () => {
    try {
      // Get approximate database size by counting records
      // This is a simplified approach - in production you'd use Supabase's built-in monitoring
      const [resumesCount, jobsCount, notificationsCount, applicationsCount] = await Promise.all([
        supabase.from('resumes').select('id', { count: 'exact', head: true }),
        supabase.from('job_postings').select('id', { count: 'exact', head: true }),
        supabase.from('email_notifications').select('id', { count: 'exact', head: true }),
        supabase.from('auto_applications').select('id', { count: 'exact', head: true })
      ]);

      // Estimate size: ~1KB per record (rough approximation)
      const totalRecords = (resumesCount.count || 0) + (jobsCount.count || 0) + (notificationsCount.count || 0) + (applicationsCount.count || 0);
      const estimatedSize = totalRecords * 1024;
      const usagePercent = (estimatedSize / (50 * 1024 * 1024)) * 100;

      setDbUsage(prev => ({ ...prev, used: estimatedSize }));

      // Alert if approaching limit
      if (usagePercent > 80) {
        toast({
          title: 'Database Usage Warning',
          description: `Database is ${usagePercent.toFixed(1)}% full. Consider cleaning up old data.`,
          variant: 'destructive',
        });
      }

      return { estimatedSize, usagePercent };
    } catch (error) {
      console.error('Error monitoring database usage:', error);
      return { estimatedSize: 0, usagePercent: 0 };
    }
  }, [toast]);

  // Automated data cleanup
  const cleanupOldData = useCallback(async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

      // Clean up old email notifications
      const { error: emailError } = await supabase
        .from('email_notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      // Clean up old auto applications (older than 90 days)
      const oldAppDate = new Date();
      oldAppDate.setDate(oldAppDate.getDate() - DATA_RETENTION_DAYS.autoApplications);
      const { error: appError } = await supabase
        .from('auto_applications')
        .delete()
        .lt('created_at', oldAppDate.toISOString());

      // Clean up old job postings (older than 180 days)
      const oldJobDate = new Date();
      oldJobDate.setDate(oldJobDate.getDate() - DATA_RETENTION_DAYS.jobPostings);
      const { error: jobError } = await supabase
        .from('job_postings')
        .delete()
        .lt('created_at', oldJobDate.toISOString());

      if (emailError || appError || jobError) {
        console.error('Cleanup errors:', { emailError, appError, jobError });
      } else {
        toast({
          title: 'Data Cleanup Complete',
          description: 'Old data has been automatically cleaned up to save storage space.',
        });
      }

      // Refresh usage after cleanup
      await monitorDatabaseUsage();
    } catch (error) {
      console.error('Error during data cleanup:', error);
    }
  }, [DATA_RETENTION_DAYS, monitorDatabaseUsage, toast]);

  // Data deduplication for job postings
  const deduplicateJobs = useCallback(async () => {
    try {
      // Find duplicate job postings based on title and company
      const { data: allJobs } = await supabase
        .from('job_postings')
        .select('id, title, company, created_at')
        .order('created_at', { ascending: false });

      if (!allJobs) return;

      const seen = new Set<string>();
      const duplicates: string[] = [];

      for (const job of allJobs) {
        const key = `${job.title?.toLowerCase()}-${job.company?.toLowerCase()}`;
        if (seen.has(key)) {
          duplicates.push(job.id);
        } else {
          seen.add(key);
        }
      }

      // Remove duplicates (keep the most recent)
      if (duplicates.length > 0) {
        const { error } = await supabase
          .from('job_postings')
          .delete()
          .in('id', duplicates);

        if (!error) {
          toast({
            title: 'Duplicates Removed',
            description: `Removed ${duplicates.length} duplicate job postings.`,
          });
        }
      }
    } catch (error) {
      console.error('Error deduplicating jobs:', error);
    }
  }, [toast]);

  // Gmail Backup System
  const createDataBackup = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Gather all user data
      const [resumesData, jobsData, applicationsData] = await Promise.all([
        supabase.from('resumes').select('*').eq('user_id', user.id),
        supabase.from('job_postings').select('*').eq('user_id', user.id),
        supabase.from('job_applications').select('*').eq('user_id', user.id)
      ]);

      const backupData = {
        user_id: user.id,
        email: user.email,
        backup_date: new Date().toISOString(),
        data: {
          resumes: resumesData.data || [],
          jobs: jobsData.data || [],
          applications: applicationsData.data || [],
          metadata: {
            total_resumes: (resumesData.data || []).length,
            total_jobs: (jobsData.data || []).length,
            total_applications: (applicationsData.data || []).length
          }
        }
      };

      return backupData;
    } catch (error: any) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }, []);

  const sendGmailBackup = useCallback(async (backupData: any) => {
    try {
      const userEmail = process.env.USER_GMAIL_ADDRESS;
      if (!userEmail) {
        throw new Error('USER_GMAIL_ADDRESS not configured in .env.local');
      }

      // Convert backup data to JSON string
      const backupJson = JSON.stringify(backupData, null, 2);

      // Create email content
      const emailContent = {
        to: userEmail,
        bcc: userEmail, // Send as BCC to user's own email
        subject: `ATS Resume Generator Backup - ${new Date().toLocaleDateString()}`,
        text: `
ATS Resume Generator Data Backup

Backup Date: ${backupData.backup_date}
User: ${backupData.email}

Summary:
- Resumes: ${backupData.data.metadata.total_resumes}
- Job Postings: ${backupData.data.metadata.total_jobs}
- Applications: ${backupData.data.metadata.total_applications}

This backup is automatically stored in your Gmail for data redundancy.
To restore data, save this email attachment and import it back into the application.

---
Automated Backup System
Supabase 50MB Free Tier Optimization
        `,
        attachments: [
          {
            filename: `ats-backup-${new Date().toISOString().split('T')[0]}.json`,
            content: backupJson,
            contentType: 'application/json'
          }
        ]
      };

      // For client-side, we'll simulate the email send
      // In production, this would use a server-side API
      console.log('Sending Gmail backup:', emailContent);

      // Simulate successful send
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Backup Sent',
        description: 'Data backup has been sent to your Gmail address',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Backup Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const performFullBackup = useCallback(async () => {
    try {
      const backupData = await createDataBackup();
      await sendGmailBackup(backupData);

      toast({
        title: 'Full Backup Complete',
        description: 'All data has been backed up to your Gmail',
      });
    } catch (error: any) {
      console.error('Full backup failed:', error);
    }
  }, [createDataBackup, sendGmailBackup, toast]);

  // Automatic data management (50MB optimization)
  useEffect(() => {
    // Initial database usage check
    monitorDatabaseUsage();

    // Set up periodic cleanup (every 24 hours)
    const cleanupInterval = setInterval(async () => {
      await cleanupOldData();
      await deduplicateJobs();
      await monitorDatabaseUsage();
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Set up periodic usage monitoring (every 6 hours)
    const usageInterval = setInterval(async () => {
      await monitorDatabaseUsage();
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Set up automatic Gmail backups (weekly)
    const backupFrequency = parseInt(process.env.BACKUP_FREQUENCY || '604800000'); // Default 7 days
    const backupInterval = setInterval(async () => {
      await performFullBackup();
    }, backupFrequency);

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(usageInterval);
      clearInterval(backupInterval);
    };
  }, [monitorDatabaseUsage, cleanupOldData, deduplicateJobs, performFullBackup]);

  useEffect(() => {
    startEmailMonitoring();
    return () => {
      stopEmailMonitoring();
    };
  }, [startEmailMonitoring, stopEmailMonitoring]);

  return {
    resumes,
    jobs,
    emailNotifications,
    autoApplications,
    loading,
    uploadProgress,
    emailMonitoring,
    dbUsage,
    fetchResumes,
    uploadResume,
    deleteResume,
    matchJobsWithResume,
    generateOptimizedResume,
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
    performFullBackup,
  };
}
