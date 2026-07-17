import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token && config.headers) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Optionally handle 401s if Supabase refresh fails, though Supabase client usually auto-refreshes.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we get a 401 and there's a specific retry logic needed, we can add it here.
    // For now, Supabase's getSession() auto-refreshes if needed before the request.
    return Promise.reject(error);
  }
);

export default api;
