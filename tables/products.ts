/**
-- ==============================================================================
-- PRODUCTS TABLE MODEL & QUERIES
-- Table 3: products (Parameter-driven product definitions: id, division_id, name,
-- slug, base_rate, min_width_mm, max_width_mm, min_height_mm, max_height_mm, bleed_mm,
-- dpi, materials_json, volume_tiers_json, print_zones_json, is_active)
-- ==============================================================================
*/

import { getSupabase } from '../configs/supabase';
import { Product, ProductInsert, ProductUpdate } from '../types/database.types';

export const PRODUCTS_TABLE = 'products';

export async function getAllActiveProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error || !data) {
    console.error('[Products Table] Error fetching active products:', error);
    return [];
  }
  return data as Product[];
}

export async function getProductsByDivision(divisionId: string): Promise<Product[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .eq('division_id', divisionId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error || !data) {
    console.error('[Products Table] Error fetching products by division:', error);
    return [];
  }
  return data as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as Product;
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Product;
}

