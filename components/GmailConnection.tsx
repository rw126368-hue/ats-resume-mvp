'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface GmailConnectionProps {
  onConnectionChange?: (connected: boolean) => void;
  className?: string;
}

function GmailConnectionContent({ onConnectionChange, className }: GmailConnectionProps) {
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    const checkConnection = async () => {
      if (!mounted || isChecking) return;
      
      try {
        await checkGmailConnection();
      } catch (error) {
        console.error('Initial Gmail connection check failed:', error);
      }
    };
    
    checkConnection();
    
    return () => {
      mounted = false;
    };
  }, []);

  const checkGmailConnection = async () => {
    // Prevent multiple concurrent requests
    if (isChecking) {
      console.log('Gmail connection check already in progress, skipping...');
      return;
    }

    try {
      setIsChecking(true);
      setCheckingStatus(true);

      // Get the current session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      );

      const sessionResult = await Promise.race([sessionPromise, timeoutPromise]) as any;
      const { data: { session }, error: sessionError } = sessionResult;

      if (sessionError) {
        console.error('Session error:', sessionError);
        setGmailConnected(false);
        onConnectionChange?.(false);
        return;
      }

      if (!session?.access_token) {
        console.log('No active session');
        setGmailConnected(false);
        onConnectionChange?.(false);
        setCheckingStatus(false);
        return;
      }

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch('/api/auth/google/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          const connected = result.data?.connected || false;
          setGmailConnected(connected);
          onConnectionChange?.(connected);
        } else {
          console.error('Failed to check Gmail status:', response.status);
          setGmailConnected(false);
          onConnectionChange?.(false);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Gmail status check timed out');
          toast({
            title: 'Connection Check Timeout',
            description: 'Gmail status check is taking too long. There may be server issues.',
            variant: 'destructive',
          });
        } else {
          throw fetchError;
        }
      }
    } catch (error: any) {
      console.error('Error checking Gmail connection:', error);
      setGmailConnected(false);
      onConnectionChange?.(false);

      const isTimeout = error.message?.includes('timeout') || error.message?.includes('Timeout');
      
      toast({
        title: 'Connection Check Failed',
        description: isTimeout
          ? 'Gmail connection check timed out. Please try again later.'
          : 'Unable to verify Gmail connection status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCheckingStatus(false);
      setIsChecking(false);
    }
  };

  const connectGmail = async () => {
    try {
      setGmailLoading(true);

      // Validate that we have a session before redirecting
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in before connecting Gmail.',
          variant: 'destructive',
        });
        return;
      }

      // Redirect to OAuth flow
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Failed to initiate Gmail connection:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to start Gmail connection process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGmailLoading(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      setGmailLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to disconnect Gmail.',
          variant: 'destructive',
        });
        return;
      }

      // Remove OAuth tokens from database
      const { error } = await supabase
        .from('user_oauth_tokens')
        .delete()
        .eq('user_id', session.user.id)
        .eq('provider', 'google');

      if (error) {
        console.error('Failed to disconnect Gmail:', error);
        toast({
          title: 'Disconnect Failed',
          description: 'Failed to disconnect Gmail. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setGmailConnected(false);
      onConnectionChange?.(false);

      toast({
        title: 'Gmail Disconnected',
        description: 'Your Gmail account has been disconnected successfully.',
      });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast({
        title: 'Disconnect Failed',
        description: 'An error occurred while disconnecting Gmail.',
        variant: 'destructive',
      });
    } finally {
      setGmailLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Gmail Integration</span>
          </CardTitle>
          <CardDescription>
            Checking connection status...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Gmail Integration</span>
        </CardTitle>
        <CardDescription>
          {gmailConnected
            ? 'Connected - Email monitoring active'
            : 'Connect Gmail to automatically find job opportunities'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Connection Status</span>
            {gmailConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            gmailConnected
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {gmailConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {gmailConnected ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Your Gmail is connected and job notifications are being monitored automatically.
            </p>
            <Button
              onClick={disconnectGmail}
              disabled={gmailLoading}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {gmailLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect Gmail'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Connect your Gmail account to automatically scan for job opportunities and application deadlines.
            </p>
            <Button
              onClick={connectGmail}
              disabled={gmailLoading}
              size="sm"
              className="w-full"
            >
              {gmailLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Gmail
                </>
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>What we access:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Read emails with job-related keywords</li>
            <li>Extract job posting information</li>
            <li>Monitor application deadlines</li>
            <li>Never send emails on your behalf</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function GmailConnection(props: GmailConnectionProps) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <Card className={props.className}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Gmail Integration</span>
            </CardTitle>
            <CardDescription>
              Connection temporarily unavailable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-red-600 mb-4">
                {error?.message || 'Failed to load Gmail connection'}
              </p>
              <Button onClick={reset} variant="outline" size="sm">
                <Loader2 className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    >
      <GmailConnectionContent {...props} />
    </ErrorBoundary>
  );
}