/**
-- ==============================================================================
-- PARAMETER-DRIVEN PRICING ENGINE
-- Calculates real-time custom quotes using dimensions, material multipliers,
-- and volume discount tiers.
-- ==============================================================================
*/

import { Product, ProductMaterial, VolumeTier } from '../types/database.types';
import { DEFAULT_VAT_RATE } from '../configs/constants';

export interface PricingParams {
  width_mm: number;
  height_mm: number;
  quantity: number;
  material_id: string;
  double_sided?: boolean;
}

export interface PricingBreakdown {
  width_mm: number;
  height_mm: number;
  quantity: number;
  material_name: string;
  material_multiplier: number;
  area_sq_m: number;
  unit_price: number;
  subtotal: number;
  discount_pct: number;
  discount_amount: number;
  subtotal_after_discount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
}

export function calculateQuote(product: Product, params: PricingParams): PricingBreakdown {
  const { width_mm, height_mm, quantity, material_id, double_sided = false } = params;

  // 1. Resolve material multiplier
  const material = product.materials_json.find((m: ProductMaterial) => m.id === material_id) || product.materials_json[0] || {
    id: 'default',
    name: 'Standard Material',
    multiplier: 1.0,
  };
  const material_multiplier = Number(material.multiplier) || 1.0;

  // 2. Calculate Area (in square meters)
  const area_sq_m = (Math.max(1, width_mm) * Math.max(1, height_mm)) / 1_000_000;

  // 3. Base unit rate (scaled by area or fixed base unit with minimum floor)
  // For standard print cards/flyers, small sizes have a base scale factor
  const sizeFactor = Math.max(0.005, area_sq_m);
  const sideMultiplier = double_sided ? 1.4 : 1.0;
  
  // Base cost per single unit
  const base_rate = Number(product.base_rate) || 0.05;
  const rawUnitPrice = Math.max(0.05, base_rate * (sizeFactor * 100) * material_multiplier * sideMultiplier);
  const unit_price = Number(rawUnitPrice.toFixed(4));

  // 4. Subtotal before volume discount
  const subtotal = Number((unit_price * quantity).toFixed(2));

  // 5. Check volume discount tiers
  let discount_pct = 0;
  if (Array.isArray(product.volume_tiers_json)) {
    const matchingTier = product.volume_tiers_json.find(
      (tier: VolumeTier) => quantity >= tier.min_qty && quantity <= tier.max_qty
    );
    if (matchingTier) {
      discount_pct = Number(matchingTier.discount_pct) || 0;
    }
  }

  // 6. Discount & Net Subtotal
  const discount_amount = Number(((subtotal * discount_pct) / 100).toFixed(2));
  const subtotal_after_discount = Number((subtotal - discount_amount).toFixed(2));

  // 7. VAT & Grand Total
  const vat_rate = DEFAULT_VAT_RATE;
  const vat_amount = Number((subtotal_after_discount * vat_rate).toFixed(2));
  const total_amount = Number((subtotal_after_discount + vat_amount).toFixed(2));

  return {
    width_mm,
    height_mm,
    quantity,
    material_name: material.name,
    material_multiplier,
    area_sq_m: Number(area_sq_m.toFixed(4)),
    unit_price,
    subtotal,
    discount_pct,
    discount_amount,
    subtotal_after_discount,
    vat_rate,
    vat_amount,
    total_amount,
  };
}

