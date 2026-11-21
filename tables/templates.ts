/**
-- ==============================================================================
-- TEMPLATES TABLE MODEL & QUERIES
-- Table 10: templates (Template-driven editing: id, product_id, name,
-- print_zones_json, default_elements_json, is_active, created_at)
-- ==============================================================================
*/

import { getSupabase, getSupabaseAdmin } from '../configs/supabase';
import { Template, TemplateInsert, TemplateUpdate } from '../types/database.types';

export const TEMPLATES_TABLE = 'templates';

export async function getTemplatesByProduct(productId: string): Promise<Template[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('[Templates Table] Error fetching templates:', error);
    return [];
  }
  return data as Template[];
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Template;
}

export async function getAllTemplatesAdmin(): Promise<Template[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Templates Table Admin] Error fetching all templates:', error);
    return [];
  }
  return data as Template[];
}

export async function createTemplate(template: TemplateInsert): Promise<Template | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .insert(template)
    .select()
    .single();

  if (error) {
    console.error('[Templates Table] Error creating template:', error);
    return null;
  }
  return data as Template;
}

export async function updateTemplate(id: string, updates: TemplateUpdate): Promise<Template | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Templates Table] Error updating template:', error);
    return null;
  }
  return data as Template;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(TEMPLATES_TABLE)
    .delete()
    .eq('id', id);

  return !error;
}

