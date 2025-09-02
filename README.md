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

## Scripts

- `pnpm dev` – start dev server
- `pnpm build` – build the app
- `pnpm start` – start in production mode

