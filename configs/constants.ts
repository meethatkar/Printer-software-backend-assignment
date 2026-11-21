/**
-- ==============================================================================
-- CONSTANTS & ENUMS CONFIGURATION
-- System constants for pipeline stages, proof review gates, VAT rates, etc.
-- ==============================================================================
*/

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
} as const;

export const PIPELINE_STATUSES = {
  QUOTE: 'QUOTE',
  ORDER: 'ORDER',
  ARTWORK: 'ARTWORK',
  PROOF: 'PROOF',
  PRODUCTION: 'PRODUCTION',
  COMPLETED: 'COMPLETED',
} as const;

export const PIPELINE_STATUS_ORDER = [
  PIPELINE_STATUSES.QUOTE,
  PIPELINE_STATUSES.ORDER,
  PIPELINE_STATUSES.ARTWORK,
  PIPELINE_STATUSES.PROOF,
  PIPELINE_STATUSES.PRODUCTION,
  PIPELINE_STATUSES.COMPLETED,
] as const;

export const PROOF_STATUSES = {
  PENDING: 'PENDING',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  APPROVED: 'APPROVED',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const FILE_FORMATS = {
  PDF: 'PDF',
  PNG: 'PNG',
  ZIP: 'ZIP',
} as const;

export const DEFAULT_VAT_RATE = 0.20; // 20% Standard VAT
export const DEFAULT_BLEED_MM = 3.0; // 3mm bleed margin
export const DEFAULT_SAFETY_MARGIN_MM = 3.0; // 3mm safety margin inside cut line
export const DEFAULT_DPI = 300; // Standard print resolution

export const STANDARD_DIVISIONS = [
  { slug: 'business-cards-stationery', name: 'Business Cards & Stationery' },
  { slug: 'marketing-flyers', name: 'Marketing & Flyers' },
  { slug: 'posters-signage', name: 'Posters & Signage' },
  { slug: 'packaging-boxes', name: 'Packaging & Boxes' },
  { slug: 'stickers-labels', name: 'Stickers & Labels' },
  { slug: 'apparel-merchandise', name: 'Apparel & Merchandise' },
] as const;

