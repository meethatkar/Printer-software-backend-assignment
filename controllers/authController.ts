/**
-- ==============================================================================
-- 1. AUTH & PROFILE CONTROLLER (EXPRESS NATIVE)
-- Methods: signup, login, logout, getProfile, updateProfile
-- ==============================================================================
*/

import { Request, Response } from 'express';
import { getSupabase, getSupabaseAdmin } from '../configs/supabase';
import { getProfileById, updateProfile as dbUpdateProfile, upsertProfile } from '../tables/profiles';

export async function signup(req: Request, res: Response): Promise<void> {
  const { email, password, full_name, company_name } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: full_name || '',
      company_name: company_name || '',
      role: 'customer',
    },
  });

  if (error || !data.user) {
    res.status(400).json({ success: false, error: error?.message || 'Failed to create user' });
    return;
  }

  const profile = await upsertProfile({
    id: data.user.id,
    email,
    full_name: full_name || null,
    company_name: company_name || null,
    role: 'customer',
  });

  res.status(201).json({
    success: true,
    data: {
      user: { id: data.user.id, email: data.user.email },
      profile,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    res.status(401).json({ success: false, error: error?.message || 'Invalid credentials' });
    return;
  }

  const profile = await getProfileById(data.user.id);

  res.status(200).json({
    success: true,
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email },
      profile,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const profile = await getProfileById(userId);
  if (!profile) {
    res.status(404).json({ success: false, error: 'Profile not found' });
    return;
  }

  res.status(200).json({ success: true, data: profile });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { full_name, company_name } = req.body || {};
  const updated = await dbUpdateProfile(userId, {
    ...(full_name !== undefined ? { full_name } : {}),
    ...(company_name !== undefined ? { company_name } : {}),
  });

  if (!updated) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
    return;
  }

  res.status(200).json({ success: true, data: updated });
}
