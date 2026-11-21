/**
-- ==============================================================================
-- XERO EXPORT FORMATTER
-- Formats order data into standard Xero Accounts Receivable Invoice JSON.
-- ==============================================================================
*/

import { Order, Profile, Product, XeroExportData } from '../types/database.types';

export function buildXeroInvoicePayload(
  order: Order,
  profile: Profile,
  productName: string
): XeroExportData {
  const invoiceDate = new Date(order.created_at || Date.now());
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30); // Net 30 payment terms

  const description = `${productName} (${order.config_json.width_mm}x${order.config_json.height_mm}mm) - Qty: ${order.quantity} [Ref: ${order.order_code}]`;

  return {
    invoice_number: order.order_code,
    contact_name: profile.company_name || profile.full_name || profile.email,
    contact_email: profile.email,
    line_items: [
      {
        description,
        quantity: order.quantity,
        unit_amount: order.unit_price,
        account_code: '200', // Standard Print Sales Revenue Account
        tax_type: 'OUTPUT2', // Standard 20% VAT
        tax_amount: order.vat_amount,
        line_amount: order.subtotal - order.discount_amount,
      },
    ],
    subtotal: order.subtotal - order.discount_amount,
    tax_amount: order.vat_amount,
    total: order.total_amount,
    currency: 'GBP',
    date: invoiceDate.toISOString().split('T')[0],
    due_date: dueDate.toISOString().split('T')[0],
    status: order.payment_status === 'PAID' ? 'AUTHORISED' : 'DRAFT',
  };
}

