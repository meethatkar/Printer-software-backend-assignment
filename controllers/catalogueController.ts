/**
-- ==============================================================================
-- 2. CATALOGUE & PRICING CONTROLLER (EXPRESS NATIVE)
-- Methods: getDivisions, getProductBySlug, getGallery, calculatePrice
-- ==============================================================================
*/

import { Request, Response } from 'express';
import { getAllDivisions, getDivisionBySlug } from '../tables/productDivisions';
import { getProductById, getProductBySlug as dbGetProductBySlug } from '../tables/products';
import { getTemplatesByProduct } from '../tables/templates';
import { getAllGalleryItems, getGalleryItemsByDivision } from '../tables/galleryItems';
import { calculateQuote } from '../utils/pricing';
import { validateProductDimensions, validateQuantity } from '../utils/validation';

export async function getDivisions(req: Request, res: Response): Promise<void> {
  const divisions = await getAllDivisions();
  res.status(200).json({ success: true, data: divisions });
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const slug = req.params.slug as string;
  const product = await dbGetProductBySlug(slug);
  if (!product) {
    res.status(404).json({ success: false, error: `Product '${slug}' not found` });
    return;
  }

  const templates = await getTemplatesByProduct(product.id);
  res.status(200).json({
    success: true,
    data: {
      product,
      templates,
    },
  });
}

export async function getGallery(req: Request, res: Response): Promise<void> {
  const division = req.query.division as string | undefined;
  if (division) {
    const divRecord = await getDivisionBySlug(division);
    const targetDivisionId = divRecord ? divRecord.id : division;
    const items = await getGalleryItemsByDivision(targetDivisionId);
    res.status(200).json({ success: true, data: items });
    return;
  }

  const items = await getAllGalleryItems();
  res.status(200).json({ success: true, data: items });
}

export async function calculatePrice(req: Request, res: Response): Promise<void> {
  const { product_id, width_mm, height_mm, quantity, material_id, double_sided } = req.body || {};
  const product = await getProductById(product_id);
  if (!product) {
    res.status(404).json({ success: false, error: 'Product not found' });
    return;
  }

  const dimCheck = validateProductDimensions(product, Number(width_mm), Number(height_mm));
  if (!dimCheck.valid) {
    res.status(400).json({ success: false, error: dimCheck.errors.join(' ') });
    return;
  }

  const qtyCheck = validateQuantity(Number(quantity));
  if (!qtyCheck.valid) {
    res.status(400).json({ success: false, error: qtyCheck.errors.join(' ') });
    return;
  }

  const quote = calculateQuote(product, {
    width_mm: Number(width_mm),
    height_mm: Number(height_mm),
    quantity: Number(quantity),
    material_id: String(material_id),
    double_sided: Boolean(double_sided),
  });

  res.status(200).json({ success: true, data: quote });
}
