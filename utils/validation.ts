/**
-- ==============================================================================
-- VALIDATION UTILITIES
-- Checks dimensions against product boundaries, validates quantities, CSV schema.
-- ==============================================================================
*/

import { Product } from '../types/database.types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProductDimensions(
  product: Product,
  width_mm: number,
  height_mm: number
): ValidationResult {
  const errors: string[] = [];

  if (width_mm < product.min_width_mm) {
    errors.push(`Width (${width_mm}mm) cannot be less than minimum allowed (${product.min_width_mm}mm).`);
  }
  if (width_mm > product.max_width_mm) {
    errors.push(`Width (${width_mm}mm) exceeds maximum allowed (${product.max_width_mm}mm).`);
  }
  if (height_mm < product.min_height_mm) {
    errors.push(`Height (${height_mm}mm) cannot be less than minimum allowed (${product.min_height_mm}mm).`);
  }
  if (height_mm > product.max_height_mm) {
    errors.push(`Height (${height_mm}mm) exceeds maximum allowed (${product.max_height_mm}mm).`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateQuantity(quantity: number): ValidationResult {
  const errors: string[] = [];
  if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
    errors.push('Quantity must be an integer greater than 0.');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCsvRows(
  csvRows: Record<string, unknown>[],
  requiredColumns: string[] = []
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(csvRows) || csvRows.length === 0) {
    errors.push('CSV data must contain at least one row.');
    return { valid: false, errors };
  }

  if (requiredColumns.length > 0) {
    const firstRowKeys = Object.keys(csvRows[0] || {});
    for (const col of requiredColumns) {
      if (!firstRowKeys.includes(col)) {
        errors.push(`Missing required column '${col}' in CSV.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

