# ATS Resume Generator (MVP)

## About the Project

The ATS Resume Generator is a social impact project designed to empower community members facing barriers to employment. Our mission is to bridge the digital divide and provide essential resources to unemployed individuals, helping them secure meaningful work and improve their economic standing.

### The Problem

Many individuals in our community, particularly those who are not digitally literate or lack access to digital tools, struggle to navigate the modern job market. They often face challenges in creating effective, ATS-friendly resumes and cover letters, and they may not have the resources to apply for jobs quickly and efficiently.

### Our Solution

The ATS Resume Generator is an AI-powered platform that simplifies the job application process for community members. Here's how it works:

1.  **Master Resume Upload:** Users upload their master resume to the platform.
2.  **AI-Powered Job Matching:** The application actively searches for relevant job openings based on the user's profile.
3.  **ATS-Optimized Resumes and Cover Letters:** For each job application, the platform generates a customized, ATS-optimized resume and cover letter tailored to the specific job description.
4.  **Automated Application Submission:** The platform can automatically submit the application on the user's behalf, ensuring that they can apply for jobs as soon as they are posted.
5.  **AI-Powered Quality Assurance:** To ensure the quality of the generated documents, we use a two-step AI process. The first AI generates the resume and cover letter, and a second AI reviews the documents for any errors or hallucinations, providing feedback to the first AI for correction.

By automating the most challenging aspects of the job application process, we aim to level the playing field for all members of our community and help them find work faster.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [pnpm](https://pnpm.io/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/your-repository.git
    cd your-repository
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    -   Create a new file named `.env.local` in the root of the project.
    -   Copy the content of `.env.example` into `.env.local`.
    -   Fill in the required environment variables in `.env.local`. You can get the values from your Supabase project's dashboard.

4.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    The application will be available at `http://localhost:3000`.

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

-   `pnpm dev` – start dev server
-   `pnpm build` – build the app
-   `pnpm start` – start in production mode
