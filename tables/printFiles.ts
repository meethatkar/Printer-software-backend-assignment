/**
-- ==============================================================================
-- PRINT FILES TABLE MODEL & QUERIES
-- Table 8: print_files (Server-generated production files unlocked after proof approval:
-- id, order_id, proof_version_id, file_name, file_format, storage_path, is_csv_batch,
-- row_count, generated_at)
-- ==============================================================================
*/

import { getSupabaseAdmin } from '../configs/supabase';
import { PrintFile, PrintFileInsert } from '../types/database.types';

export const PRINT_FILES_TABLE = 'print_files';

export async function getPrintFilesForOrder(orderId: string): Promise<PrintFile[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PRINT_FILES_TABLE)
    .select('*')
    .eq('order_id', orderId)
    .order('generated_at', { ascending: false });

  if (error || !data) {
    console.error('[Print Files Table] Error fetching print files:', error);
    return [];
  }
  return data as PrintFile[];
}

export async function getPrintFileById(id: string): Promise<PrintFile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PRINT_FILES_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as PrintFile;
}

export async function recordPrintFile(printFile: PrintFileInsert): Promise<PrintFile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PRINT_FILES_TABLE)
    .insert(printFile)
    .select()
    .single();

  if (error) {
    console.error('[Print Files Table] Error inserting print file record:', error);
    return null;
  }
  return data as PrintFile;
}

