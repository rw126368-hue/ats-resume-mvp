# ATS Resume Generator (MVP)

## Quick Start in Codespaces

Click below to open this project directly in GitHub Codespaces:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=${{ github.repository }})


This is the MVP frontend for the ATS Resume Generator project.

## Run in GitHub Codespaces

1. Open this repository in GitHub Codespaces.
2. The Dev Container will automatically:
   - Install dependencies with `pnpm install`
   - Start the Next.js dev server on port 3000
3. The preview window will open automatically.

## Environment Variables

Copy `.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_API_BASE_URL=https://<your-supabase-project>.supabase.co/functions/v1
NEXT_PUBLIC_STORAGE_URL=https://<your-supabase-project>.supabase.co/storage/v1/object/public/resume-files
```

For the demo, you can commit `.env.local` with these public values.

## Gmail Backup System Setup

### Why Gmail Backup?
The application uses Gmail as a backup storage system to prevent Supabase database overflow and provide data redundancy. This is especially important for the 50MB free tier limit.

### Setup Instructions:

1. **Configure Environment Variables:**
   ```env
   USER_GMAIL_ADDRESS=your-email@gmail.com
   BACKUP_FREQUENCY=604800000  # 7 days in milliseconds
   ```

2. **Set up Gmail Filter:**
   - Go to Gmail → Settings → See all settings → Filters and Blocked Addresses
   - Click "Create a new filter"
   - In "From" field: enter your Gmail address
   - In "Subject" field: enter "ATS Resume Generator Backup"
   - Click "Create filter"
   - Select "Skip the Inbox (Archive it)"
   - Select "Apply the label" and create a new label called "ATS-Backups"
   - Click "Create filter"

3. **Automatic Backup:**
   - The system automatically sends weekly backups to your Gmail
   - All backups are BCC'd to your email address
   - Gmail automatically moves them to the "ATS-Backups" folder

4. **Manual Backup:**
   - Use the "Backup Now" button in the Jobs dashboard
   - Immediate backup sent to your Gmail

### Benefits:
- ✅ Data redundancy outside Supabase database
- ✅ Automatic weekly backups
- ✅ Prevents data loss when reaching 50MB limit
- ✅ Easy data restoration from Gmail archives
- ✅ No additional storage costs

## Supabase Database Setup

### Required Tables

Create these tables in your Supabase dashboard:

#### 1. Job Postings Table
```sql
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  company TEXT,
  description TEXT,
  requirements TEXT,
  location TEXT,
  salary_range TEXT,
  job_type TEXT DEFAULT 'full-time',
  source TEXT DEFAULT 'manual',
  application_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own data
CREATE POLICY "Users can view their own job postings" ON job_postings
  FOR ALL USING (auth.uid() = user_id);
```

#### 2. Email Notifications Table
```sql
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  subject TEXT,
  from_address TEXT,
  content_path TEXT,
  job_title TEXT,
  company_name TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own data
CREATE POLICY "Users can view their own email notifications" ON email_notifications
  FOR ALL USING (auth.uid() = user_id);
```

#### 3. Auto Applications Table
```sql
CREATE TABLE auto_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  job_id UUID,
  resume_id UUID,
  match_score INTEGER,
  applied BOOLEAN DEFAULT false,
  application_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE auto_applications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own data
CREATE POLICY "Users can view their own auto applications" ON auto_applications
  FOR ALL USING (auth.uid() = user_id);
```

### Required Storage Buckets

Create these storage buckets in your Supabase dashboard:

1. **resume-files** - For storing uploaded resume files
2. **email-content** - For storing large email content

## Scripts

- `pnpm dev` – start dev server
- `pnpm build` – build the app
- `pnpm start` – start in production mode

