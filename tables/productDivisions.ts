/**
-- ==============================================================================
-- PRODUCT DIVISIONS TABLE MODEL & QUERIES
-- Table 2: product_divisions (The 6 print divisions: id, name, slug, description, sort_order)
-- ==============================================================================
*/

import { getSupabase } from '../configs/supabase';
import { ProductDivision, ProductDivisionInsert } from '../types/database.types';

export const PRODUCT_DIVISIONS_TABLE = 'product_divisions';

export async function getAllDivisions(): Promise<ProductDivision[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(PRODUCT_DIVISIONS_TABLE)
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.error('[Divisions Table] Error fetching divisions:', error);
    return [];
  }
  return data as ProductDivision[];
}

export async function getDivisionBySlug(slug: string): Promise<ProductDivision | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(PRODUCT_DIVISIONS_TABLE)
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as ProductDivision;
}

export async function getDivisionById(id: string): Promise<ProductDivision | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(PRODUCT_DIVISIONS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as ProductDivision;
}

