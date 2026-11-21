/**
-- ==============================================================================
-- PROFILES TABLE MODEL & QUERIES
-- Table 1: profiles (Extends auth.users: id, email, full_name, company_name, role, created_at)
-- ==============================================================================
*/

import { getSupabase, getSupabaseAdmin } from '../configs/supabase';
import { Profile, ProfileInsert, ProfileUpdate } from '../types/database.types';

export const PROFILES_TABLE = 'profiles';

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function upsertProfile(profile: ProfileInsert): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .upsert(profile)
    .select()
    .single();

  if (error) {
    console.error('[Profiles Table] Error upserting profile:', error);
    return null;
  }
  return data as Profile;
}

export async function updateProfile(id: string, updates: ProfileUpdate): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Profiles Table] Error updating profile:', error);
    return null;
  }
  return data as Profile;
}

