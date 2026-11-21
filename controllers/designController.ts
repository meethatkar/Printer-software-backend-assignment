/**
-- ==============================================================================
-- 3. DESIGNS & UPLOADS CONTROLLER (EXPRESS NATIVE)
-- Methods: listMyDesigns, saveDesign, uploadArtwork, parseCsvVariables
-- ==============================================================================
*/

import { Request, Response } from 'express';
import { getUserSavedDesigns, createSavedDesign } from '../tables/savedDesigns';
import { validateCsvRows } from '../utils/validation';

export async function listMyDesigns(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const designs = await getUserSavedDesigns(userId);
  res.status(200).json({ success: true, data: designs });
}

export async function saveDesign(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { product_id, title, config_json, design_json, uploaded_file_url } = req.body || {};
  if (!product_id || !title) {
    res.status(400).json({ success: false, error: 'product_id and title are required' });
    return;
  }

  const design = await createSavedDesign({
    user_id: userId,
    product_id,
    title,
    config_json: config_json || {},
    design_json: design_json || { elements: [] },
    uploaded_file_url: uploaded_file_url || null,
  });

  if (!design) {
    res.status(500).json({ success: false, error: 'Failed to save design' });
    return;
  }

  res.status(201).json({ success: true, data: design });
}

export async function uploadArtwork(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { fileName, contentType } = req.body || {};
  if (!fileName || !contentType) {
    res.status(400).json({ success: false, error: 'fileName and contentType are required' });
    return;
  }

  const allowedTypes = ['application/pdf', 'image/png', 'image/svg+xml', 'image/jpeg', 'application/illustrator'];
  if (!allowedTypes.includes(contentType)) {
    res.status(400).json({ success: false, error: `Invalid file format '${contentType}'. Supported: PDF, PNG, SVG, AI, JPEG.` });
    return;
  }

  const timestamp = Date.now();
  const sanitizedName = String(fileName).replace(/[^a-zA-Z0-9.-]/g, '_');
  const storageUrl = `/storage/v1/object/public/artwork-uploads/${userId}/${timestamp}_${sanitizedName}`;

  res.status(201).json({
    success: true,
    data: {
      uploaded: true,
      file_url: storageUrl,
      file_name: sanitizedName,
      content_type: contentType,
    },
  });
}

export async function parseCsvVariables(req: Request, res: Response): Promise<void> {
  const { csvContent, requiredHeaders } = req.body || {};
  if (!csvContent || String(csvContent).trim() === '') {
    res.status(400).json({ success: false, error: 'csvContent is required' });
    return;
  }

  const lines = String(csvContent).trim().split(/\r?\n/);
  if (lines.length < 2) {
    res.status(400).json({ success: false, error: 'CSV must contain a header row and at least one data row' });
    return;
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  const validation = validateCsvRows(rows, requiredHeaders);
  if (!validation.valid) {
    res.status(400).json({ success: false, error: validation.errors.join(' ') });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      total_rows: rows.length,
      headers,
      preview: rows.slice(0, 5),
      rows,
    },
  });
}
