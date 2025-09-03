# ATS Resume Generator (MVP)

This is the MVP frontend for the ATS Resume Generator project.

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
