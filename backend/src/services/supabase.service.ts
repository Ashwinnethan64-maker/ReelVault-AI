import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Initialize Supabase Client
const supabaseUrl = env.SUPABASE_URL || '';
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
