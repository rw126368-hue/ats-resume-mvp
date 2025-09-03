'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDebugInfo('Checking authentication status...');

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Authentication check timed out. Please refresh the page.');
        setDebugInfo('Timeout reached - authentication check failed');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      setDebugInfo(`Authentication check complete. Authenticated: ${isAuthenticated}`);

      if (isAuthenticated) {
        setDebugInfo('Redirecting to dashboard...');
        router.push('/dashboard');
      } else {
        setDebugInfo('Redirecting to login...');
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show debug information for troubleshooting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />

        {error ? (
          <div className="mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading application...</p>
          </div>
        )}

        {/* Debug Information */}
        <div className="text-left bg-gray-100 p-3 rounded text-xs font-mono">
          <div className="font-semibold mb-2">Debug Info:</div>
          <div>Loading: {loading ? 'true' : 'false'}</div>
          <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
          <div>User: {user ? user.email : 'null'}</div>
          <div>Status: {debugInfo}</div>
          <div>Environment: {typeof window !== 'undefined' ? 'Browser' : 'Server'}</div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          If this page doesn't redirect automatically, try refreshing or check the browser console for errors.
        </div>
      </div>
    </div>
  );
}