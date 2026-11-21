/**
-- ==============================================================================
-- PROOF VERSIONS TABLE MODEL & QUERIES
-- Table 7: proof_versions (Tracks v1, v2... revisions and approval audit trail:
-- id, order_id, version_number, design_snapshot_json, uploaded_file_url, status,
-- change_request_notes, approved_by, approved_at, created_at)
-- ==============================================================================
*/

import { getSupabaseAdmin } from '../configs/supabase';
import { ProofVersion, ProofVersionInsert, ProofVersionUpdate, ProofStatus } from '../types/database.types';

export const PROOF_VERSIONS_TABLE = 'proof_versions';

export async function getProofVersionsForOrder(orderId: string): Promise<ProofVersion[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PROOF_VERSIONS_TABLE)
    .select('*')
    .eq('order_id', orderId)
    .order('version_number', { ascending: true });

  if (error || !data) {
    console.error('[Proof Versions Table] Error fetching versions:', error);
    return [];
  }
  return data as ProofVersion[];
}

export async function getProofVersionById(id: string): Promise<ProofVersion | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PROOF_VERSIONS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as ProofVersion;
}

export async function createProofVersion(proof: ProofVersionInsert): Promise<ProofVersion | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PROOF_VERSIONS_TABLE)
    .insert(proof)
    .select()
    .single();

  if (error) {
    console.error('[Proof Versions Table] Error creating proof version:', error);
    return null;
  }
  return data as ProofVersion;
}

export async function updateProofStatus(
  id: string,
  status: ProofStatus,
  options?: {
    change_request_notes?: string;
    approved_by?: string;
  }
): Promise<ProofVersion | null> {
  const supabase = getSupabaseAdmin();
  const updateData: ProofVersionUpdate = {
    status,
    ...(options?.change_request_notes !== undefined ? { change_request_notes: options.change_request_notes } : {}),
    ...(options?.approved_by ? { approved_by: options.approved_by, approved_at: new Date().toISOString() } : {}),
  };

  const { data, error } = await supabase
    .from(PROOF_VERSIONS_TABLE)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Proof Versions Table] Error updating proof status:', error);
    return null;
  }
  return data as ProofVersion;
}

