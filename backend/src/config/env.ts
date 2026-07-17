import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'OPENAI_API_KEY',
];

const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  // The user requested: "Do not stop because an environment variable is missing... Continue implementing everything else."
  // So we will just warn, not throw an error.
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};
