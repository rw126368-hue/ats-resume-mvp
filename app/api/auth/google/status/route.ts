import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSuccessResponse, createErrorResponse, ERROR_CODES } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header first
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createSuccessResponse({
          connected: false,
          message: 'Authentication required'
        }),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        createSuccessResponse({
          connected: false,
          message: 'Invalid authentication'
        }),
        { status: 401 }
      );
    }

    // Check if user has OAuth tokens
    try {
      const { data: oauthTokens, error: tokenError } = await supabase
        .from('user_oauth_tokens')
        .select('email, created_at')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (tokenError || !oauthTokens) {
        return NextResponse.json(createSuccessResponse({
          connected: false,
          message: 'Gmail not connected'
        }));
      }

      return NextResponse.json(createSuccessResponse({
        connected: true,
        email: oauthTokens.email,
        connected_at: oauthTokens.created_at,
        message: 'Gmail connected successfully'
      }));
    } catch (dbError: any) {
      console.error('Database query timeout or error:', dbError);
      return NextResponse.json(createSuccessResponse({
        connected: false,
        message: 'Unable to verify Gmail connection due to server issues'
      }));
    }

  } catch (error: any) {
    console.error('Gmail status check error:', error);
    
    // Return a successful response with connected: false instead of an error
    // This prevents the UI from showing error toasts for server issues
    return NextResponse.json(createSuccessResponse({
      connected: false,
      message: 'Unable to check Gmail connection status'
    }));
  }
}