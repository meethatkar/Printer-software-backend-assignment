/**
-- ==============================================================================
-- ORDER CODE GENERATOR
-- Generates unique, memorable order codes, e.g.: ORD-20261121-7A3F
-- ==============================================================================
*/

export function generateOrderCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `ORD-${year}${month}${day}-${randomHex}`;
}

export function formatPrintFileName(orderCode: string, productSlug: string, isBatch = false): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const cleanSlug = productSlug.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const cleanOrder = orderCode.replace(/[^a-zA-Z0-9]/g, '_');
  const suffix = isBatch ? 'VDP_BATCH_OUTPUT' : 'OUTPUT';

  return `${cleanOrder}_${cleanSlug}_${dateStr}_${suffix}`;
}

