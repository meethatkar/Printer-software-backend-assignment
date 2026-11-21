/**
-- ==============================================================================
-- GALLERY ITEMS TABLE MODEL & QUERIES
-- Table 4: gallery_items (Live Work Gallery samples: id, division_id, title,
-- image_url, specs_label)
-- ==============================================================================
*/

import { getSupabase } from '../configs/supabase';
import { GalleryItem, GalleryItemInsert } from '../types/database.types';

export const GALLERY_ITEMS_TABLE = 'gallery_items';

export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(GALLERY_ITEMS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Gallery Items] Error fetching gallery items:', error);
    return [];
  }
  return data as GalleryItem[];
}

export async function getGalleryItemsByDivision(divisionId: string): Promise<GalleryItem[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(GALLERY_ITEMS_TABLE)
    .select('*')
    .eq('division_id', divisionId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Gallery Items] Error fetching gallery items by division:', error);
    return [];
  }
  return data as GalleryItem[];
}

