/**
-- ==============================================================================
-- SAVED DESIGNS TABLE MODEL & QUERIES
-- Table 5: saved_designs (Reusable customer artwork for one-click reorders:
-- id, user_id, product_id, title, config_json, design_json, uploaded_file_url, created_at)
-- ==============================================================================
*/

import { getSupabaseAdmin } from '../configs/supabase';
import { SavedDesign, SavedDesignInsert, SavedDesignUpdate } from '../types/database.types';

export const SAVED_DESIGNS_TABLE = 'saved_designs';

export async function getUserSavedDesigns(userId: string): Promise<SavedDesign[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(SAVED_DESIGNS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Saved Designs Table] Error fetching user designs:', error);
    return [];
  }
  return data as SavedDesign[];
}

export async function getSavedDesignById(id: string): Promise<SavedDesign | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(SAVED_DESIGNS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as SavedDesign;
}

export async function createSavedDesign(design: SavedDesignInsert): Promise<SavedDesign | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(SAVED_DESIGNS_TABLE)
    .insert(design)
    .select()
    .single();

  if (error) {
    console.error('[Saved Designs Table] Error creating saved design:', error);
    return null;
  }
  return data as SavedDesign;
}

export async function updateSavedDesign(id: string, updates: SavedDesignUpdate): Promise<SavedDesign | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(SAVED_DESIGNS_TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Saved Designs Table] Error updating saved design:', error);
    return null;
  }
  return data as SavedDesign;
}

export async function deleteSavedDesign(id: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(SAVED_DESIGNS_TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  return !error;
}

