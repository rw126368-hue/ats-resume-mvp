-- Supabase Database Setup for ATS Resume Generator
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
      title TEXT NOT NULL,
        file_path TEXT,
          content TEXT,
            status TEXT DEFAULT 'published',
              version INTEGER DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                  );

                  -- Create job_postings table
                  CREATE TABLE IF NOT EXISTS job_postings (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                      user_id UUID NOT NULL,
                        title TEXT NOT NULL,
                          company TEXT NOT NULL,
                            description TEXT,
                              requirements TEXT,
                                location TEXT,
                                  salary_range TEXT,
                                    job_type TEXT DEFAULT 'full-time',
                                      source TEXT DEFAULT 'manual',
                                        application_url TEXT,
                                          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                                            );

                                            -- Create job_applications table
                                            CREATE TABLE IF NOT EXISTS job_applications (
                                              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                                                user_id UUID NOT NULL,
                                                  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
                                                    company_name TEXT NOT NULL,
                                                      position_title TEXT NOT NULL,
                                                        job_description TEXT,
                                                          status TEXT DEFAULT 'pending',
                                                            match_score INTEGER,
                                                              notes TEXT,
                                                                applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                                                                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                                                                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                                                                    );

                                                                    -- Create email_notifications table
                                                                    CREATE TABLE IF NOT EXISTS email_notifications (
                                                                      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                                                                        user_id UUID NOT NULL,
                                                                          subject TEXT NOT NULL,
                                                                            from_address TEXT NOT NULL,
                                                                              content_path TEXT,
                                                                                job_title TEXT,
                                                                                  company_name TEXT,
                                                                                    processed BOOLEAN DEFAULT FALSE,
                                                                                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                                                                                      );

                                                                                      -- Create auto_applications table
                                                                                      CREATE TABLE IF NOT EXISTS auto_applications (
                                                                                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                                                                                          user_id UUID NOT NULL,
                                                                                            job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
                                                                                              resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
                                                                                                match_score INTEGER NOT NULL,
                                                                                                  applied BOOLEAN DEFAULT FALSE,
                                                                                                    application_url TEXT,
                                                                                                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                                                                                                      );
                                                                                      
                                                                                                      -- Create user_oauth_tokens table for Google OAuth
                                                                                                      CREATE TABLE IF NOT EXISTS user_oauth_tokens (
                                                                                                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                                                                                                          user_id UUID NOT NULL,
                                                                                                            provider TEXT NOT NULL,
                                                                                                              access_token TEXT NOT NULL,
                                                                                                                refresh_token TEXT,
                                                                                                                  expires_at TIMESTAMP WITH TIME ZONE,
                                                                                                                    email TEXT,
                                                                                                                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                                                                                                                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                                                                                                                          UNIQUE(user_id, provider)
                                                                                                                          );

                                                                                                      -- Enable Row Level Security on all tables
                                                                                                      ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
                                                                                                      ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
                                                                                                      ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
                                                                                                      ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
                                                                                                      ALTER TABLE auto_applications ENABLE ROW LEVEL SECURITY;
                                                                                                      ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

                                                                                                      -- Create RLS policies for resumes
                                                                                                      CREATE POLICY "Users can view their own resumes" ON resumes
                                                                                                        FOR SELECT USING (auth.uid() = user_id);

                                                                                                        CREATE POLICY "Users can insert their own resumes" ON resumes
                                                                                                          FOR INSERT WITH CHECK (auth.uid() = user_id);

                                                                                                          CREATE POLICY "Users can update their own resumes" ON resumes
                                                                                                            FOR UPDATE USING (auth.uid() = user_id);

                                                                                                            CREATE POLICY "Users can delete their own resumes" ON resumes
                                                                                                              FOR DELETE USING (auth.uid() = user_id);

                                                                                                              -- Create RLS policies for job_postings
                                                                                                              CREATE POLICY "Users can view their own job postings" ON job_postings
                                                                                                                FOR SELECT USING (auth.uid() = user_id);

                                                                                                                CREATE POLICY "Users can insert their own job postings" ON job_postings
                                                                                                                  FOR INSERT WITH CHECK (auth.uid() = user_id);

                                                                                                                  CREATE POLICY "Users can update their own job postings" ON job_postings
                                                                                                                    FOR UPDATE USING (auth.uid() = user_id);

                                                                                                                    CREATE POLICY "Users can delete their own job postings" ON job_postings
                                                                                                                      FOR DELETE USING (auth.uid() = user_id);

                                                                                                                      -- Create RLS policies for job_applications
                                                                                                                      CREATE POLICY "Users can view their own job applications" ON job_applications
                                                                                                                        FOR SELECT USING (auth.uid() = user_id);

                                                                                                                        CREATE POLICY "Users can insert their own job applications" ON job_applications
                                                                                                                          FOR INSERT WITH CHECK (auth.uid() = user_id);

                                                                                                                          CREATE POLICY "Users can update their own job applications" ON job_applications
                                                                                                                            FOR UPDATE USING (auth.uid() = user_id);

                                                                                                                            CREATE POLICY "Users can delete their own job applications" ON job_applications
                                                                                                                              FOR DELETE USING (auth.uid() = user_id);

                                                                                                                              -- Create RLS policies for email_notifications
                                                                                                                              CREATE POLICY "Users can view their own email notifications" ON email_notifications
                                                                                                                                FOR SELECT USING (auth.uid() = user_id);

                                                                                                                                CREATE POLICY "Users can insert their own email notifications" ON email_notifications
                                                                                                                                  FOR INSERT WITH CHECK (auth.uid() = user_id);

                                                                                                                                  CREATE POLICY "Users can update their own email notifications" ON email_notifications
                                                                                                                                    FOR UPDATE USING (auth.uid() = user_id);

                                                                                                                                    CREATE POLICY "Users can delete their own email notifications" ON email_notifications
                                                                                                                                      FOR DELETE USING (auth.uid() = user_id);

                                                                                                                                      -- Create RLS policies for auto_applications
                                                                                                                                      CREATE POLICY "Users can view their own auto applications" ON auto_applications
                                                                                                                                        FOR SELECT USING (auth.uid() = user_id);
                                                                                                                                      
                                                                                                                                        CREATE POLICY "Users can insert their own auto applications" ON auto_applications
                                                                                                                                          FOR INSERT WITH CHECK (auth.uid() = user_id);
                                                                                                                                      
                                                                                                                                          CREATE POLICY "Users can update their own auto applications" ON auto_applications
                                                                                                                                            FOR UPDATE USING (auth.uid() = user_id);
                                                                                                                                      
                                                                                                                                            CREATE POLICY "Users can delete their own auto applications" ON auto_applications
                                                                                                                                              FOR DELETE USING (auth.uid() = user_id);
                                                                                                                                      
                                                                                                                                              -- Create RLS policies for user_oauth_tokens
                                                                                                                                              CREATE POLICY "Users can view their own OAuth tokens" ON user_oauth_tokens
                                                                                                                                                FOR SELECT USING (auth.uid() = user_id);
                                                                                                                                      
                                                                                                                                                CREATE POLICY "Users can insert their own OAuth tokens" ON user_oauth_tokens
                                                                                                                                                  FOR INSERT WITH CHECK (auth.uid() = user_id);
                                                                                                                                      
                                                                                                                                                  CREATE POLICY "Users can update their own OAuth tokens" ON user_oauth_tokens
                                                                                                                                                    FOR UPDATE USING (auth.uid() = user_id);
                                                                                                                                      
                                                                                                                                                    CREATE POLICY "Users can delete their own OAuth tokens" ON user_oauth_tokens
                                                                                                                                                      FOR DELETE USING (auth.uid() = user_id);

                                                                                                                                              -- Create storage buckets
                                                                                                                                              INSERT INTO storage.buckets (id, name, public)
                                                                                                                                              VALUES
                                                                                                                                                ('resume-files', 'resume-files', false),
                                                                                                                                                  ('email-content', 'email-content', false)
                                                                                                                                                  ON CONFLICT (id) DO NOTHING;

                                                                                                                                                  -- Create storage policies for resume-files bucket
                                                                                                                                                  CREATE POLICY "Users can view their own resume files" ON storage.objects
                                                                                                                                                    FOR SELECT USING (bucket_id = 'resume-files' AND auth.uid()::text = (storage.foldername(name))[1]);

                                                                                                                                                    CREATE POLICY "Users can upload their own resume files" ON storage.objects
                                                                                                                                                      FOR INSERT WITH CHECK (bucket_id = 'resume-files' AND auth.uid()::text = (storage.foldername(name))[1]);

                                                                                                                                                      CREATE POLICY "Users can update their own resume files" ON storage.objects
                                                                                                                                                        FOR UPDATE USING (bucket_id = 'resume-files' AND auth.uid()::text = (storage.foldername(name))[1]);

                                                                                                                                                        CREATE POLICY "Users can delete their own resume files" ON storage.objects
                                                                                                                                                          FOR DELETE USING (bucket_id = 'resume-files' AND auth.uid()::text = (storage.foldername(name))[1]);

                                                                                                                                                          -- Create storage policies for email-content bucket
                                                                                                                                                          CREATE POLICY "Users can view their own email content" ON storage.objects
                                                                                                                                                            FOR SELECT USING (bucket_id = 'email-content' AND auth.uid()::text = (storage.foldername(name))[1]);

                                                                                                                                                            CREATE POLICY "Users can upload their own email content" ON storage.objects
                                                                                                                                                              FOR INSERT WITH CHECK (bucket_id = 'email-content' AND auth.uid()::text = (storage.foldername(name))[1]);

                                                                                                                                                              CREATE POLICY "Users can update their own email content" ON storage.objects
                                                                                                                                                                FOR UPDATE USING (bucket_id = 'email-content' AND auth.uid()::text = (storage.foldername(name))[1]);

                                                                                                                                                                CREATE POLICY "Users can delete their own email content" ON storage.objects
                                                                                                                                                                  FOR DELETE USING (bucket_id = 'email-content' AND auth.uid()::text = (storage.foldername(name))[1]);

                                                                                                                                                                  -- Create indexes for better performance
                                                                                                                                                                  CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
                                                                                                                                                                  CREATE INDEX IF NOT EXISTS idx_job_postings_user_id ON job_postings(user_id);
                                                                                                                                                                  CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
                                                                                                                                                                  CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
                                                                                                                                                                  CREATE INDEX IF NOT EXISTS idx_auto_applications_user_id ON auto_applications(user_id);
                                                                                                                                                                  CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_user_id ON user_oauth_tokens(user_id);
                                                                                                                                                                  CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_provider ON user_oauth_tokens(provider);

                                                                                                                                                                  -- Create updated_at trigger function
                                                                                                                                                                  CREATE OR REPLACE FUNCTION update_updated_at_column()
                                                                                                                                                                  RETURNS TRIGGER AS $$
                                                                                                                                                                  BEGIN
                                                                                                                                                                    NEW.updated_at = NOW();
                                                                                                                                                                      RETURN NEW;
                                                                                                                                                                      END;
                                                                                                                                                                      $$ language 'plpgsql';

                                                                                                                                                                      -- Create triggers for updated_at
                                                                                                                                                                      CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                                                                                                                                                                      CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                                                                                                                                                                      CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();