# ReelVault AI

AI-Powered Personal Knowledge Vault. Transform your saved Instagram Reels into searchable, structured knowledge with automatic AI tagging and summaries.

## Deployment Guide

### Prerequisites
- Node 20+
- PostgreSQL (Supabase)
- OpenAI API Key
- Cloudinary Account
- Google OAuth Credentials

### Environment Variables
Review the `.env.example` file in the `backend` directory.
Make sure to provide `DATABASE_URL` (port 5432 or 6543) and `DIRECT_URL` for migrations.

### CI/CD
This repository is configured with a GitHub Actions workflow `.github/workflows/main.yml` that automatically lints, typechecks, and runs tests for both the frontend and backend on every push to `main`.

### Frontend Deployment (Vercel)
The frontend is pre-configured with a `vercel.json` for SPA routing.
1. Connect this repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Vercel will automatically run `npm run build`.

### Backend Deployment (Railway)
The backend is configured with `railway.toml` for Nixpacks deployment.
1. Connect this repository to Railway.
2. Set the Root Directory to `backend`.
3. Ensure all environment variables are mapped in the Railway dashboard.
4. The deployment will automatically run migrations and start the server using `npm start`.

### Production Security
- **Rate Limiting**: Configured to 100 requests / 15 min.
- **CORS**: Ensure `FRONTEND_URL` is set in production.
- **Helmet**: active by default.
- **Logging**: Structured Winston logs are available via console.
