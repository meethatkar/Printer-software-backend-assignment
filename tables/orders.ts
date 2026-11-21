/**
-- ==============================================================================
-- ORDERS TABLE MODEL & QUERIES
-- Table 6: orders (Core transactional & production record: id, order_code,
-- user_id, product_id, saved_design_id, config_json, csv_rows_json, unit_price,
-- quantity, subtotal, discount_amount, vat_amount, total_amount, payment_status,
-- payment_ref, xero_export_data, pipeline_status, approved_proof_id, created_at, updated_at)
-- ==============================================================================
*/

import { getSupabaseAdmin } from '../configs/supabase';
import { Order, OrderInsert, OrderUpdate, PipelineStatus } from '../types/database.types';

export const ORDERS_TABLE = 'orders';

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Order;
}

export async function getOrderByCode(orderCode: string): Promise<Order | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select('*')
    .eq('order_code', orderCode)
    .single();

  if (error || !data) return null;
  return data as Order;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Orders Table] Error fetching user orders:', error);
    return [];
  }
  return data as Order[];
}

export async function getAllOrders(): Promise<Order[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Orders Table] Error fetching all orders:', error);
    return [];
  }
  return data as Order[];
}

export interface OrderFilters {
  status?: PipelineStatus;
  is_archived?: boolean;
  search?: string;
  userId?: string;
}

export async function getFilteredOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from(ORDERS_TABLE).select('*');

  if (filters.status) {
    query = query.eq('pipeline_status', filters.status);
  }

  if (filters.is_archived !== undefined) {
    query = query.eq('is_archived', filters.is_archived);
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.search) {
    query = query.or(`order_code.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error || !data) {
    console.error('[Orders Table] Error querying filtered orders:', error);
    return [];
  }
  return data as Order[];
}

export async function archiveOrder(orderId: string, isArchived = true): Promise<Order | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({ is_archived: isArchived })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('[Orders Table] Error archiving order:', error);
    return null;
  }
  return data as Order;
}

export async function getOrdersForXeroExport(): Promise<Order[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select('*')
    .not('xero_export_data', 'is', null)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Order[];
}


export async function createOrder(order: OrderInsert): Promise<Order | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .insert(order)
    .select()
    .single();

  if (error) {
    console.error('[Orders Table] Error creating order:', error);
    return null;
  }
  return data as Order;
}

export async function updateOrderStatus(orderId: string, pipeline_status: PipelineStatus): Promise<Order | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({ pipeline_status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('[Orders Table] Error updating order status:', error);
    return null;
  }
  return data as Order;
}

export async function linkApprovedProof(orderId: string, proofVersionId: string): Promise<Order | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({ 
      approved_proof_id: proofVersionId,
      pipeline_status: 'PRODUCTION' // Approving proof progresses order to PRODUCTION stage
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('[Orders Table] Error linking approved proof:', error);
    return null;
  }
  return data as Order;
}

export async function updateOrder(id: string, updates: OrderUpdate): Promise<Order | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Orders Table] Error updating order:', error);
    return null;
  }
  return data as Order;
}

