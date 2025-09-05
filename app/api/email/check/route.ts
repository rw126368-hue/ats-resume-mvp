import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

interface EmailJobNotification {
  id: string;
  subject: string;
  from: string;
  body: string;
  received_date: Date;
  job_title?: string;
  company_name?: string;
  job_description?: string;
  application_url?: string;
  processed: boolean;
}

export async function POST(request: NextRequest) {
  console.log('=== GMAIL API CHECK CALLED ===');

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // First try to get user with the provided token
    const { data: { user: initialUser }, error: authError } = await supabase.auth.getUser(token);

    let user = initialUser;

    // If token is invalid, try to refresh the session
    if (authError || !user) {
      console.log('Token invalid, attempting to refresh session...');

      // Try to get a fresh session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error('Session refresh failed:', sessionError);
        return NextResponse.json(
          { error: 'Authentication session expired. Please log in again.' },
          { status: 401 }
        );
      }

      // Use the fresh session token
      const freshToken = sessionData.session.access_token;
      const freshUserResult = await supabase.auth.getUser(freshToken);

      if (freshUserResult.error || !freshUserResult.data.user) {
        console.error('Fresh token validation failed:', freshUserResult.error);
        return NextResponse.json(
          { error: 'Authentication failed. Please log in again.' },
          { status: 401 }
        );
      }

      user = freshUserResult.data.user;
      console.log('Session refreshed successfully for user:', user.email);
    }

    console.log(`Authenticated user: ${user.email}`);

    // Get stored OAuth tokens
    const { data: oauthTokens, error: tokenError } = await supabase
      .from('user_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (tokenError || !oauthTokens) {
      console.log('Gmail not connected for user:', user.email);
      return NextResponse.json(
        {
          error: 'Gmail not connected',
          details: 'Please connect your Gmail account first to check emails',
          suggestions: [
            'Go to dashboard and click "Connect Gmail"',
            'Authorize the application to access your Gmail',
            'Grant both read and modify permissions',
            'Try checking emails again after connecting'
          ],
          action_required: 'connect_gmail'
        },
        { status: 403 }
      );
    }

    // Initialize OAuth2 client with stored tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: oauthTokens.access_token,
      refresh_token: oauthTokens.refresh_token,
      expiry_date: oauthTokens.expires_at ? new Date(oauthTokens.expires_at).getTime() : undefined
    });

    // Check if token is expired and refresh if needed
    const now = Date.now();
    const expiresAt = oauthTokens.expires_at ? new Date(oauthTokens.expires_at).getTime() : 0;
    const isExpired = expiresAt < (now + 60000); // 1 minute buffer

    if (isExpired && oauthTokens.refresh_token) {
      console.log('Refreshing OAuth token...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Update stored tokens
        await supabase
          .from('user_oauth_tokens')
          .update({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
            expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('provider', 'google');
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        throw new Error('Gmail authorization expired. Please reconnect your account.');
      }
    }

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Search for job-related emails
    const searchQuery = process.env.GMAIL_SEARCH_QUERY || 'subject:(job OR opportunity OR hiring OR career)';
    const maxResults = parseInt(process.env.GMAIL_MAX_RESULTS || '50');

    console.log('Searching Gmail with query:', searchQuery);

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: maxResults
    });

    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} potential job emails`);

    const jobNotifications: EmailJobNotification[] = [];

    // Process each message
    for (const message of messages.slice(0, 20)) { // Limit to 20 emails
      try {
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        });

        const emailData = messageData.data;
        const headers = emailData.payload?.headers || [];

        // Extract email details
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        // Get email body
        let emailBody = '';
        if (emailData.payload?.body?.data) {
          emailBody = Buffer.from(emailData.payload.body.data, 'base64').toString();
        } else if (emailData.payload?.parts) {
          // Handle multipart messages
          const textPart = emailData.payload.parts.find((part: any) =>
            part.mimeType === 'text/plain' && part.body?.data
          );
          if (textPart?.body?.data) {
            emailBody = Buffer.from(textPart.body.data, 'base64').toString();
          }
        }

        // Skip emails from known non-job sources
        const skipDomains = ['noreply', 'no-reply', 'notification', 'alert', 'billing', 'receipt'];
        const fromLower = from.toLowerCase();
        if (skipDomains.some(domain => fromLower.includes(domain))) {
          continue;
        }

        // Extract job details
        const jobTitle = extractJobTitle(subject, emailBody);
        const companyName = extractCompanyName(subject, emailBody);
        const jobDescription = extractJobDescription(emailBody);
        const applicationUrl = extractApplicationUrl(emailBody);

        // Only include emails that seem to be job-related
        if (jobTitle || companyName || applicationUrl) {
          const notification: EmailJobNotification = {
            id: message.id!,
            subject,
            from,
            body: emailBody,
            received_date: date ? new Date(date) : new Date(),
            job_title: jobTitle,
            company_name: companyName,
            job_description: jobDescription,
            application_url: applicationUrl,
            processed: false
          };

          jobNotifications.push(notification);
        }
      } catch (parseError) {
        console.error('Error parsing Gmail message:', parseError);
        continue;
      }
    }

    console.log(`Processed ${jobNotifications.length} job notifications`);

    return NextResponse.json({
      success: true,
      notifications: jobNotifications,
      count: jobNotifications.length
    });

  } catch (error: any) {
    console.error('=== GMAIL API ERROR ===');
    console.error('Error:', error);

    let errorMessage = 'Failed to check Gmail';
    let suggestions: string[] = [];

    if (error.message?.includes('invalid_grant')) {
      errorMessage = 'Gmail authorization expired';
      suggestions = [
        'Please reconnect your Gmail account',
        'Go to dashboard and click "Connect Gmail" again'
      ];
    } else if (error.message?.includes('access_denied')) {
      errorMessage = 'Gmail access denied';
      suggestions = [
        'Check your Gmail permissions',
        'Re-authorize the application'
      ];
    } else if (error.message?.includes('quota')) {
      errorMessage = 'Gmail API quota exceeded';
      suggestions = [
        'Wait a few minutes before trying again',
        'Check your Google Cloud Console for quota usage'
      ];
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper functions for extracting job information from emails
function extractJobTitle(subject: string, body: string): string | undefined {
  // Look for common job title patterns
  const patterns = [
    /position[:\s]+([^\n\r]+)/i,
    /job[:\s]+([^\n\r]+)/i,
    /opening[:\s]+([^\n\r]+)/i,
    /role[:\s]+([^\n\r]+)/i,
    /vacancy[:\s]+([^\n\r]+)/i,
    /we're hiring[:\s]*([^\n\r]+)/i,
    /hiring[:\s]*([^\n\r]+)/i
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match) return match[1].trim();
  }

  return undefined;
}

function extractCompanyName(subject: string, body: string): string | undefined {
  // Look for company name patterns
  const patterns = [
    /at\s+([^\n\r,]+)/i,
    /with\s+([^\n\r,]+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+hiring/i,
    /join\s+([^\n\r,]+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+has\s+an?\s+opening/i
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match) return match[1].trim();
  }

  return undefined;
}

function extractJobDescription(body: string): string | undefined {
  // Extract text between common job description markers
  const patterns = [
    /description[:\s]*([\s\S]*?)(?:requirements|qualifications|apply|application|responsibilities)/i,
    /about\s+the\s+role[:\s]*([\s\S]*?)(?:requirements|qualifications|benefits|what you'll do)/i,
    /job\s+summary[:\s]*([\s\S]*?)(?:requirements|qualifications|responsibilities)/i,
    /overview[:\s]*([\s\S]*?)(?:requirements|qualifications|responsibilities)/i
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      const description = match[1].trim();
      // Return first 1000 characters to avoid overly long descriptions
      return description.length > 1000 ? description.substring(0, 1000) + '...' : description;
    }
  }

  // Return first 500 characters as fallback
  return body.substring(0, 500);
}

function extractApplicationUrl(body: string): string | undefined {
  // Look for URLs that might be application links
  const urlPattern = /https?:\/\/[^\s]+(?:apply|application|job|career|join)[^\s]*/gi;
  const match = body.match(urlPattern);
  return match ? match[0] : undefined;
}