/**
-- ==============================================================================
-- 4. ORDERS & CHECKOUT CONTROLLER (EXPRESS NATIVE)
-- Methods: createOrder, listMyOrders, getMyOrder, reorderOrder, downloadInvoice
-- ==============================================================================
*/

import { Request, Response } from 'express';
import { createOrder as dbCreateOrder, getOrderById, getUserOrders } from '../tables/orders';
import { getProductById } from '../tables/products';
import { getProfileById } from '../tables/profiles';
import { createProofVersion } from '../tables/proofVersions';
import { NotificationService } from '../services/notificationService';
import { calculateQuote } from '../utils/pricing';
import { generateOrderCode } from '../utils/orderCode';
import { buildXeroInvoicePayload } from '../utils/xeroExport';

export async function createOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { product_id, saved_design_id, config_json, design_json, csv_rows_json, quantity, payment_ref } = req.body || {};
  const product = await getProductById(product_id);
  if (!product) {
    res.status(404).json({ success: false, error: 'Product not found' });
    return;
  }

  const profile = await getProfileById(userId);
  if (!profile) {
    res.status(404).json({ success: false, error: 'Profile not found' });
    return;
  }

  const quote = calculateQuote(product, {
    width_mm: Number(config_json?.width_mm),
    height_mm: Number(config_json?.height_mm),
    quantity: Number(quantity),
    material_id: String(config_json?.material_id),
    double_sided: Boolean(config_json?.double_sided),
  });

  const order_code = generateOrderCode();
  const invoice_number = `INV-${order_code.replace('ORD-', '')}`;

  const orderRecord = await dbCreateOrder({
    order_code,
    invoice_number,
    is_archived: false,
    user_id: userId,
    product_id: product.id,
    saved_design_id: saved_design_id || null,
    config_json: config_json || {},
    csv_rows_json: csv_rows_json || null,
    unit_price: quote.unit_price,
    quantity: quote.quantity,
    subtotal: quote.subtotal,
    discount_amount: quote.discount_amount,
    vat_amount: quote.vat_amount,
    total_amount: quote.total_amount,
    payment_status: payment_ref ? 'PAID' : 'PENDING',
    payment_ref: payment_ref || null,
    xero_export_data: null,
    pipeline_status: 'ORDER',
    approved_proof_id: null,
  });

  if (!orderRecord) {
    res.status(500).json({ success: false, error: 'Failed to record order' });
    return;
  }

  const xeroData = buildXeroInvoicePayload(orderRecord, profile, product.name);
  orderRecord.xero_export_data = xeroData;

  const proofV1 = await createProofVersion({
    order_id: orderRecord.id,
    version_number: 1,
    design_snapshot_json: design_json || { elements: [], bleed_mm: product.bleed_mm },
    uploaded_file_url: null,
    status: 'PENDING',
    change_request_notes: null,
    approved_by: null,
    approved_at: null,
  });

  await NotificationService.send(
    userId,
    orderRecord.id,
    'ORDER_PLACED',
    `Order ${order_code} Confirmed`,
    `Your print order for ${product.name} (Qty: ${quantity}) has been placed. Proof v1 is ready for your review.`
  );

  res.status(201).json({
    success: true,
    data: {
      order: orderRecord,
      initial_proof: proofV1,
      quote,
    },
  });
}

export async function listMyOrders(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const orders = await getUserOrders(userId);
  res.status(200).json({ success: true, data: orders });
}

export async function getMyOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const orderId = req.params.id as string;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const order = await getOrderById(orderId);
  if (!order || order.user_id !== userId) {
    res.status(404).json({ success: false, error: 'Order not found or unauthorized' });
    return;
  }

  res.status(200).json({ success: true, data: order });
}

export async function reorderOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const orderId = req.params.id as string;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const existing = await getOrderById(orderId);
  if (!existing || existing.user_id !== userId) {
    res.status(404).json({ success: false, error: 'Original order not found' });
    return;
  }

  req.body = {
    product_id: existing.product_id,
    saved_design_id: existing.saved_design_id || undefined,
    config_json: existing.config_json,
    csv_rows_json: existing.csv_rows_json || undefined,
    quantity: existing.quantity,
  };

  return createOrder(req, res);
}

export async function downloadInvoice(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const orderId = req.params.id as string;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const order = await getOrderById(orderId);
  if (!order || order.user_id !== userId) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const profile = await getProfileById(userId);

  res.status(200).json({
    success: true,
    data: {
      invoice_number: order.invoice_number,
      order_code: order.order_code,
      date: order.created_at,
      customer_name: profile?.company_name || profile?.full_name || profile?.email,
      subtotal: order.subtotal - order.discount_amount,
      vat_amount: order.vat_amount,
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      payment_ref: order.payment_ref,
      xero_invoice: order.xero_export_data,
    },
  });
}
