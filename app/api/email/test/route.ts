import { NextRequest, NextResponse } from 'next/server';
import * as imap from 'imap-simple';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('=== EMAIL TEST API CALLED ===');
  console.log('Request method:', request.method);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

  try {
    console.log('Initializing Supabase client for test...');
    // Initialize Supabase client for server-side authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('Getting authorization header for test...');
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Test auth header present:', !!authHeader);
    console.log('Test auth header starts with Bearer:', authHeader?.startsWith('Bearer'));

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Test authentication failed: missing or invalid auth header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log(`Test authenticated user: ${user.email}`);

    const config = {
      imap: {
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASS || '',
        host: process.env.EMAIL_HOST || 'imap.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '993'),
        tls: process.env.EMAIL_TLS === 'true',
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000
      }
    };

    // Validate required environment variables
    if (!config.imap.user || !config.imap.password) {
      console.error('Email credentials not configured');
      return NextResponse.json(
        {
          error: 'Email service not configured',
          details: {
            userConfigured: !!config.imap.user,
            passwordConfigured: !!config.imap.password,
            host: config.imap.host,
            port: config.imap.port
          }
        },
        { status: 500 }
      );
    }

    console.log('Testing IMAP connection...');

    try {
      // Connect to IMAP server
      const connection = await imap.connect(config);
      console.log('IMAP connection successful');

      // Open INBOX
      await connection.openBox('INBOX');
      console.log('INBOX opened successfully');

      // Get mailbox info by checking the current box
      console.log('Connection established, checking mailbox...');

      // Close connection
      connection.end();

      return NextResponse.json({
        success: true,
        message: 'IMAP connection test successful',
        details: 'Successfully connected to Gmail IMAP server and opened INBOX'
      });

    } catch (imapError: any) {
      console.error('IMAP connection failed:', imapError);

      let errorType = 'Unknown IMAP error';
      let suggestions: string[] = [];

      if (imapError.message?.includes('Authentication failed')) {
        errorType = 'Authentication failed';
        suggestions = [
          'Check if your Gmail password is correct',
          'If you have 2FA enabled, use an App Password instead of your regular password',
          'Enable "Less secure app access" in Gmail settings (not recommended for security)',
          'Verify EMAIL_USER and EMAIL_PASS in .env.local are set correctly'
        ];
      } else if (imapError.message?.includes('connect')) {
        errorType = 'Connection failed';
        suggestions = [
          'Check your internet connection',
          'Verify EMAIL_HOST and EMAIL_PORT are correct',
          'Try disabling any VPN or firewall temporarily'
        ];
      } else if (imapError.message?.includes('timeout')) {
        errorType = 'Connection timeout';
        suggestions = [
          'Check your internet connection speed',
          'Try again in a few moments',
          'Verify Gmail IMAP is enabled in your account settings'
        ];
      }

      return NextResponse.json(
        {
          error: errorType,
          details: imapError.message,
          suggestions: suggestions
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Test failed:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}