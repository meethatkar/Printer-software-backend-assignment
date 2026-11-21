/**
-- ==============================================================================
-- 7. ADMIN PRODUCTION & REPORTS CONTROLLER (EXPRESS NATIVE)
-- Methods: listAllOrders, advanceStage, archiveOrder, getAnalytics, exportXeroOrders,
-- listUsers, updateUserRole, createProduct, updateProduct, createTemplate, updateTemplate
-- ==============================================================================
*/

import { Request, Response } from 'express';
import { getFilteredOrders, getOrderById, updateOrderStatus, archiveOrder as dbArchiveOrder, getOrdersForXeroExport } from '../tables/orders';
import { getAllActiveProducts, getProductById } from '../tables/products';
import { getAllTemplatesAdmin, createTemplate as dbCreateTemplate, updateTemplate as dbUpdateTemplate } from '../tables/templates';
import { updateProfile } from '../tables/profiles';
import { getSupabaseAdmin } from '../configs/supabase';
import { NotificationService } from '../services/notificationService';
import { PipelineStatus, UserRole } from '../types/database.types';
import { PIPELINE_STATUSES } from '../configs/constants';

export async function listAllOrders(req: Request, res: Response): Promise<void> {
  const { status, is_archived, search, userId } = req.query;
  const orders = await getFilteredOrders({
    status: status as PipelineStatus | undefined,
    is_archived: is_archived !== undefined ? is_archived === 'true' : undefined,
    search: search as string | undefined,
    userId: userId as string | undefined,
  });

  res.status(200).json({ success: true, data: orders, meta: { total: orders.length } });
}

export async function advanceStage(req: Request, res: Response): Promise<void> {
  const orderId = req.params.id as string;
  const { status } = req.body || {};
  const validStatuses = Object.values(PIPELINE_STATUSES);

  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status '${status}'. Allowed: ${validStatuses.join(', ')}` });
    return;
  }

  const order = await getOrderById(orderId);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const updated = await updateOrderStatus(orderId, status);
  if (!updated) {
    res.status(500).json({ success: false, error: 'Failed to advance pipeline stage' });
    return;
  }

  await NotificationService.send(
    order.user_id,
    order.id,
    `STAGE_${status}`,
    `Order ${order.order_code} Status: ${status}`,
    `Your order ${order.order_code} has advanced to the ${status} stage in our production pipeline.`
  );

  res.status(200).json({ success: true, data: updated });
}

export async function archiveOrder(req: Request, res: Response): Promise<void> {
  const orderId = req.params.id as string;
  const { is_archived = true } = req.body || {};

  const order = await getOrderById(orderId);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const updated = await dbArchiveOrder(orderId, Boolean(is_archived));
  if (!updated) {
    res.status(500).json({ success: false, error: 'Failed to update archive status' });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      order_id: orderId,
      is_archived: updated.is_archived,
      message: is_archived ? 'Order archived' : 'Order restored from archive',
    },
  });
}

export async function getAnalytics(req: Request, res: Response): Promise<void> {
  const allOrders = await getFilteredOrders({ is_archived: false });
  let totalRevenue = 0;
  let paidRevenue = 0;
  const statusCounts: Record<string, number> = {
    QUOTE: 0,
    ORDER: 0,
    ARTWORK: 0,
    PROOF: 0,
    PRODUCTION: 0,
    COMPLETED: 0,
  };

  allOrders.forEach((o) => {
    const total = Number(o.total_amount) || 0;
    totalRevenue += total;
    if (o.payment_status === 'PAID') paidRevenue += total;
    statusCounts[o.pipeline_status] = (statusCounts[o.pipeline_status] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: {
      total_orders: allOrders.length,
      active_production_jobs: statusCounts['PRODUCTION'] || 0,
      pending_proofs: statusCounts['PROOF'] || 0,
      completed_jobs: statusCounts['COMPLETED'] || 0,
      total_revenue: Number(totalRevenue.toFixed(2)),
      paid_revenue: Number(paidRevenue.toFixed(2)),
      pipeline_distribution: statusCounts,
    },
  });
}

export async function exportXeroOrders(req: Request, res: Response): Promise<void> {
  const orders = await getOrdersForXeroExport();
  const invoices = orders
    .filter((o) => o.xero_export_data)
    .map((o) => ({
      order_id: o.id,
      order_code: o.order_code,
      invoice_number: o.invoice_number,
      ...o.xero_export_data,
    }));

  res.status(200).json({
    success: true,
    data: {
      invoices,
      count: invoices.length,
      exported_at: new Date().toISOString(),
    },
  });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) {
    res.status(500).json({ success: false, error: 'Failed to list users' });
    return;
  }
  res.status(200).json({ success: true, data });
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const userId = req.params.id as string;
  const { role } = req.body || {};
  if (!role || (role !== 'admin' && role !== 'customer')) {
    res.status(400).json({ success: false, error: "Valid role ('customer' | 'admin') is required" });
    return;
  }

  const updated = await updateProfile(userId, { role });
  if (!updated) {
    res.status(500).json({ success: false, error: 'Failed to update user role' });
    return;
  }

  res.status(200).json({ success: true, data: updated });
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('products').insert(req.body).select().single();
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  res.status(201).json({ success: true, data });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const productId = req.params.id as string;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('products').update(req.body).eq('id', productId).select().single();
  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  res.status(200).json({ success: true, data });
}

export async function createTemplate(req: Request, res: Response): Promise<void> {
  const created = await dbCreateTemplate(req.body);
  if (!created) {
    res.status(500).json({ success: false, error: 'Failed to create template' });
    return;
  }
  res.status(201).json({ success: true, data: created });
}

export async function updateTemplate(req: Request, res: Response): Promise<void> {
  const templateId = req.params.id as string;
  const updated = await dbUpdateTemplate(templateId, req.body);
  if (!updated) {
    res.status(500).json({ success: false, error: 'Failed to update template' });
    return;
  }
  res.status(200).json({ success: true, data: updated });
}
