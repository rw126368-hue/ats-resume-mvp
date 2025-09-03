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

## Scripts

-   `pnpm dev` – start dev server
-   `pnpm build` – build the app
-   `pnpm start` – start in production mode
