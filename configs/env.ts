/**
-- ==============================================================================
-- ENVIRONMENT CONFIGURATION & VALIDATION
-- Handles Supabase credentials, app URLs, and server runtime variables.
-- ==============================================================================
*/

export interface ServerEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NODE_ENV: string;
  APP_URL: string;
}

export function getEnv(): ServerEnv {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';

  return {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV,
    APP_URL,
  };
}

export function validateEnv(): { valid: boolean; missing: string[] } {
  const env = getEnv();
  const missing: string[] = [];

  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL');
  if (!env.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return {
    valid: missing.length === 0,
    missing,
  };
}

