'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useResumes } from '@/hooks/useResumes';
import { useJobApplications } from '@/hooks/useJobApplications';
import { FileText, BarChart3, Briefcase, TrendingUp, Upload, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { GmailConnection } from '@/components/GmailConnection';
import { supabase } from '@/lib/supabase/client';

export default function DashboardPage() {
  const { resumes, fetchResumes, loading: resumesLoading } = useResumes();
  const { applications, fetchApplications, getApplicationStats, loading: appsLoading } = useJobApplications();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalResumes: 0,
    avgAtsScore: 0,
    totalApplications: 0,
    responseRate: 0
  });
  const [gmailConnected, setGmailConnected] = useState(false);

  useEffect(() => {
    fetchResumes();
    fetchApplications();

    // Check for OAuth success/error messages from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'gmail_connected') {
      toast({
        title: 'Gmail Connected!',
        description: 'Your Gmail account has been successfully connected.',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setGmailConnected(true);
    } else if (error) {
      let errorMessage = 'Failed to connect Gmail account.';
      if (error === 'oauth_failed') {
        errorMessage = 'OAuth authorization failed.';
      } else if (error === 'no_code') {
        errorMessage = 'Authorization code not received.';
      } else if (error === 'no_email') {
        errorMessage = 'Could not retrieve email address.';
      } else if (error === 'token_storage_failed') {
        errorMessage = 'Failed to save authorization tokens.';
      } else if (error === 'session_expired') {
        errorMessage = 'Your session has expired. Please log in again.';
      }

      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchResumes, fetchApplications, toast]);

  const handleGmailConnectionChange = (connected: boolean) => {
    setGmailConnected(connected);
  };

  useEffect(() => {
    if (resumes.length > 0) {
      const avgScore = resumes.reduce((sum, resume) => sum + (resume.ats_score || 0), 0) / resumes.length;
      setStats(prev => ({
        ...prev,
        totalResumes: resumes.length,
        avgAtsScore: Math.round(avgScore)
      }));
    }

    if (applications.length > 0) {
      const appStats = getApplicationStats();
      const responseRate = appStats.total > 0 
        ? Math.round(((appStats.interviewing + appStats.accepted) / appStats.total) * 100)
        : 0;
      
      setStats(prev => ({
        ...prev,
        totalApplications: appStats.total,
        responseRate
      }));
    }
  }, [resumes, applications, getApplicationStats]);

  const recentResumes = resumes.slice(0, 3);
  const recentApplications = applications.slice(0, 3);

  const StatCard = ({ title, value, description, icon: Icon, trend, trendValue }: any) => (
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
        {trend && (
          <div className={`flex items-center text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {trendValue}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );

  const QuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Get started with your resume optimization journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GmailConnection onConnectionChange={handleGmailConnectionChange} />

        <Link href="/dashboard/resumes">
          <Button className="w-full justify-start">
            <Upload className="mr-2 h-4 w-4" />
            Upload New Resume
          </Button>
        </Link>
        <Link href="/dashboard/analysis">
          <Button variant="outline" className="w-full justify-start">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analyze Resume
          </Button>
        </Link>
        <Link href="/dashboard/jobs">
          <Button variant="outline" className="w-full justify-start">
            <Briefcase className="mr-2 h-4 w-4" />
            Track Job Application
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  const RecentResumes = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Resumes</CardTitle>
        <CardDescription>
          Your latest uploaded resumes and their ATS scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resumesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentResumes.length > 0 ? (
          <div className="space-y-4">
            {recentResumes.map((resume) => (
              <div key={resume.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{resume.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(resume.created_at)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {resume.ats_score && (
                    <div className="text-right">
                      <div className="text-sm font-medium">{resume.ats_score}%</div>
                      <div className="text-xs text-muted-foreground">ATS Score</div>
                    </div>
                  )}
                  <Link href={`/dashboard/resumes/${resume.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            <Link href="/dashboard/resumes">
              <Button variant="outline" size="sm" className="w-full">
                View All Resumes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resumes</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by uploading your first resume.</p>
            <div className="mt-6">
              <Link href="/dashboard/resumes">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resume
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const RecentApplications = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Applications</CardTitle>
        <CardDescription>
          Track your job application progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentApplications.length > 0 ? (
          <div className="space-y-4">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{app.position_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.company_name} • {formatDate(app.applied_date)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    app.status === 'interviewing' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'applied' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
            <Link href="/dashboard/jobs">
              <Button variant="outline" size="sm" className="w-full">
                View All Applications
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
            <p className="mt-1 text-sm text-gray-500">Start tracking your job applications.</p>
            <div className="mt-6">
              <Link href="/dashboard/jobs">
                <Button>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Add Application
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your resume optimization progress.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Resumes"
          value={stats.totalResumes}
          description="Uploaded and optimized"
          icon={FileText}
        />
        <StatCard
          title="Average ATS Score"
          value={`${stats.avgAtsScore}%`}
          description="Across all resumes"
          icon={BarChart3}
        />
        <StatCard
          title="Job Applications"
          value={stats.totalApplications}
          description="Currently tracking"
          icon={Briefcase}
        />
        <StatCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          description="Interviews + offers"
          icon={TrendingUp}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <RecentResumes />
          <RecentApplications />
        </div>
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
