/**
-- ==============================================================================
-- SUPABASE CLIENT CONFIGURATION
-- Creates both user-scoped client and elevated service-role / admin client.
-- ==============================================================================
*/

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';

let _supabaseClient: SupabaseClient | null = null;
let _supabaseAdminClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabaseClient) return _supabaseClient;
  const env = getEnv();
  
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.warn('[Supabase Config] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Falling back to dummy client for local development/build.');
    _supabaseClient = createClient(
      env.SUPABASE_URL || 'https://placeholder-project.supabase.co',
      env.SUPABASE_ANON_KEY || 'placeholder-anon-key'
    );
    return _supabaseClient;
  }

  _supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });

  return _supabaseClient;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdminClient) return _supabaseAdminClient;
  const env = getEnv();

  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || 'placeholder-service-key';
  const url = env.SUPABASE_URL || 'https://placeholder-project.supabase.co';

  _supabaseAdminClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _supabaseAdminClient;
}

