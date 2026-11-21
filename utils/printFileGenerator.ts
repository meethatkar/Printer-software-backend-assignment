/**
-- ==============================================================================
-- PRODUCTION PRINT FILE GENERATOR
-- Generates high-res production ready PDFs using pdf-lib, embedding crop marks,
-- bleeds, and variable data printing rows.
-- ==============================================================================
*/

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Order, ProofVersion, Product } from '../types/database.types';
import { formatPrintFileName } from './orderCode';

export interface GeneratedPrintOutput {
  fileName: string;
  format: 'PDF';
  bytes: Uint8Array;
  rowCount: number;
}

export async function generateProductionPdf(
  order: Order,
  proof: ProofVersion,
  product: Product
): Promise<GeneratedPrintOutput> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Convert mm to points (1 inch = 25.4 mm = 72 pt -> 1 mm = 72 / 25.4 pt = 2.83465 pt)
  const MM_TO_PT = 2.83465;
  const widthPt = (order.config_json.width_mm || 85) * MM_TO_PT;
  const heightPt = (order.config_json.height_mm || 55) * MM_TO_PT;
  const bleedPt = (product.bleed_mm || 3.0) * MM_TO_PT;

  const totalWidth = widthPt + bleedPt * 2;
  const totalHeight = heightPt + bleedPt * 2;

  const csvRows = order.csv_rows_json;
  const isVdpBatch = Array.isArray(csvRows) && csvRows.length > 0;
  const iterations = isVdpBatch ? csvRows.length : 1;

  for (let i = 0; i < iterations; i++) {
    const page = pdfDoc.addPage([totalWidth, totalHeight]);
    const vdpData = isVdpBatch ? csvRows[i] : {};

    // 1. Draw Bleed & Trim Guides (Light Cyan Trim Border)
    page.drawRectangle({
      x: bleedPt,
      y: bleedPt,
      width: widthPt,
      height: heightPt,
      borderColor: rgb(0, 0.7, 0.9),
      borderWidth: 0.5,
    });

    // 2. Draw Crop Marks in Corners
    const markLength = 10;
    // Bottom-Left
    page.drawLine({ start: { x: bleedPt - markLength, y: bleedPt }, end: { x: bleedPt, y: bleedPt }, color: rgb(0, 0, 0), thickness: 0.5 });
    page.drawLine({ start: { x: bleedPt, y: bleedPt - markLength }, end: { x: bleedPt, y: bleedPt }, color: rgb(0, 0, 0), thickness: 0.5 });

    // Top-Left
    page.drawLine({ start: { x: bleedPt - markLength, y: bleedPt + heightPt }, end: { x: bleedPt, y: bleedPt + heightPt }, color: rgb(0, 0, 0), thickness: 0.5 });
    page.drawLine({ start: { x: bleedPt, y: bleedPt + heightPt + markLength }, end: { x: bleedPt, y: bleedPt + heightPt }, color: rgb(0, 0, 0), thickness: 0.5 });

    // 3. Render Artwork Elements
    const elements = proof.design_snapshot_json?.elements || [];
    for (const el of elements) {
      if (el.type === 'text') {
        let displayText = el.text || '';
        // If VDP field mapped, substitute from CSV row
        if (el.vdpColumn && vdpData[el.vdpColumn]) {
          displayText = String(vdpData[el.vdpColumn]);
        }

        const fontSize = Math.max(6, (el.fontSize || 12) * 0.8);
        const elX = bleedPt + (el.x * MM_TO_PT);
        const elY = totalHeight - bleedPt - (el.y * MM_TO_PT) - fontSize;

        page.drawText(displayText, {
          x: Math.max(bleedPt, elX),
          y: Math.max(bleedPt, elY),
          size: fontSize,
          font: font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }
    }

    // 4. Job Slug Bar (Slug Information in Bleed Margin)
    const slugInfo = `JOB: ${order.order_code} | REV: v${proof.version_number} | ITEM: ${i + 1}/${iterations} | ${product.name}`;
    page.drawText(slugInfo, {
      x: bleedPt,
      y: 4,
      size: 5,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const fileName = `${formatPrintFileName(order.order_code, product.slug, isVdpBatch)}.pdf`;

  return {
    fileName,
    format: 'PDF',
    bytes: pdfBytes,
    rowCount: iterations,
  };
}

