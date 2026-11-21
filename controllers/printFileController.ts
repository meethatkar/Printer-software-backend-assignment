/**
-- ==============================================================================
-- 6. PRINT-FILE ENGINE CONTROLLER (EXPRESS NATIVE)
-- Role Access: Admin Only
-- Methods: generatePrintOutput, downloadPrintFile
-- ==============================================================================
*/

import { Request, Response } from 'express';
import { getPrintFilesForOrder, recordPrintFile } from '../tables/printFiles';
import { getOrderById } from '../tables/orders';
import { getProofVersionById } from '../tables/proofVersions';
import { getProductById } from '../tables/products';
import { generateProductionPdf } from '../utils/printFileGenerator';
import { NotificationService } from '../services/notificationService';

export async function generatePrintOutput(req: Request, res: Response): Promise<void> {
  const orderId = req.params.orderId as string;
  const order = await getOrderById(orderId);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  // STRICT APPROVAL GATE: 403 if approved_proof_id is null
  if (!order.approved_proof_id) {
    res.status(403).json({
      success: false,
      error: 'GATE REJECTED: Production print files are strictly locked until a proof version is approved.',
    });
    return;
  }

  const proof = await getProofVersionById(order.approved_proof_id);
  if (!proof || proof.status !== 'APPROVED') {
    res.status(403).json({
      success: false,
      error: 'GATE REJECTED: Approved proof version not found or status not APPROVED',
    });
    return;
  }

  const product = await getProductById(order.product_id);
  if (!product) {
    res.status(404).json({ success: false, error: 'Product definition not found' });
    return;
  }

  const pdfOutput = await generateProductionPdf(order, proof, product);
  const storagePath = `production-vault/${order.id}/${pdfOutput.fileName}`;

  const fileRecord = await recordPrintFile({
    order_id: order.id,
    proof_version_id: proof.id,
    file_name: pdfOutput.fileName,
    file_format: 'PDF',
    storage_path: storagePath,
    is_csv_batch: pdfOutput.rowCount > 1,
    row_count: pdfOutput.rowCount,
  });

  if (!fileRecord) {
    res.status(500).json({ success: false, error: 'Failed to record print file' });
    return;
  }

  await NotificationService.send(
    order.user_id,
    order.id,
    'PRINT_FILE_READY',
    'Print Production Output Generated',
    `High-res file '${pdfOutput.fileName}' (${pdfOutput.rowCount} items) has been rendered and queued for print production.`
  );

  res.status(201).json({
    success: true,
    data: {
      print_file: fileRecord,
      file_name: pdfOutput.fileName,
      row_count: pdfOutput.rowCount,
      file_size_bytes: pdfOutput.bytes.byteLength,
    },
  });
}

export async function downloadPrintFile(req: Request, res: Response): Promise<void> {
  const orderId = req.params.orderId as string;
  const fileId = req.query.fileId as string | undefined;

  const files = await getPrintFilesForOrder(orderId);
  if (files.length === 0) {
    res.status(404).json({
      success: false,
      error: 'No production files generated yet for this order. Ensure proof is approved and generatePrintOutput has been run.',
    });
    return;
  }

  const targetFile = fileId ? files.find((f) => f.id === fileId) || files[0] : files[0];

  res.status(200).json({
    success: true,
    data: {
      file_id: targetFile.id,
      file_name: targetFile.file_name,
      file_format: targetFile.file_format,
      storage_path: targetFile.storage_path,
      row_count: targetFile.row_count,
      generated_at: targetFile.generated_at,
      download_url: `/api/admin/orders/${orderId}/print-files/${targetFile.id}/stream`,
    },
  });
}
