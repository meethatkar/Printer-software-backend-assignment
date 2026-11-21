/**
-- ==============================================================================
-- 5. PROOFING & VERSIONING CONTROLLER (EXPRESS NATIVE)
-- Methods: getOrderProofs, createProofRevision, approveProof, requestChanges
-- ==============================================================================
*/

import { Request, Response } from 'express';
import { getProofVersionsForOrder, getProofVersionById, createProofVersion, updateProofStatus } from '../tables/proofVersions';
import { getOrderById, linkApprovedProof, updateOrderStatus } from '../tables/orders';
import { NotificationService } from '../services/notificationService';

export async function getOrderProofs(req: Request, res: Response): Promise<void> {
  const orderId = req.params.orderId as string;
  const versions = await getProofVersionsForOrder(orderId);
  res.status(200).json({ success: true, data: versions });
}

export async function createProofRevision(req: Request, res: Response): Promise<void> {
  const orderId = req.params.orderId as string;
  const { design_snapshot_json, uploaded_file_url } = req.body || {};

  const order = await getOrderById(orderId);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const existingProofs = await getProofVersionsForOrder(orderId);
  const nextVersionNumber = existingProofs.length + 1;

  const newProof = await createProofVersion({
    order_id: orderId,
    version_number: nextVersionNumber,
    design_snapshot_json: design_snapshot_json || { elements: [] },
    uploaded_file_url: uploaded_file_url || null,
    status: 'PENDING',
    change_request_notes: null,
    approved_by: null,
    approved_at: null,
  });

  if (!newProof) {
    res.status(500).json({ success: false, error: 'Failed to create proof revision' });
    return;
  }

  await updateOrderStatus(orderId, 'PROOF');

  await NotificationService.send(
    order.user_id,
    order.id,
    'PROOF_REVISION_CREATED',
    `Proof Revision v${nextVersionNumber} Ready`,
    `A new proof revision (v${nextVersionNumber}) for order ${order.order_code} is ready for review.`
  );

  res.status(201).json({ success: true, data: newProof });
}

export async function approveProof(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const proofId = req.params.proofId as string;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const proof = await getProofVersionById(proofId);
  if (!proof) {
    res.status(404).json({ success: false, error: 'Proof not found' });
    return;
  }

  const order = await getOrderById(proof.order_id);
  if (!order) {
    res.status(404).json({ success: false, error: 'Associated order not found' });
    return;
  }

  const updatedProof = await updateProofStatus(proofId, 'APPROVED', {
    approved_by: userId,
  });

  const updatedOrder = await linkApprovedProof(order.id, proofId);

  await NotificationService.send(
    order.user_id,
    order.id,
    'PROOF_APPROVED',
    `Proof v${proof.version_number} Approved!`,
    `Order ${order.order_code} has advanced to PRODUCTION stage. Print production files are now unlocked.`
  );

  res.status(200).json({
    success: true,
    data: {
      proof: updatedProof,
      order: updatedOrder,
      message: 'Proof approved. Production files unlocked.',
    },
  });
}

export async function requestChanges(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const proofId = req.params.proofId as string;
  const { notes } = req.body || {};
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (!notes || String(notes).trim() === '') {
    res.status(400).json({ success: false, error: 'Change request notes cannot be blank' });
    return;
  }

  const proof = await getProofVersionById(proofId);
  if (!proof) {
    res.status(404).json({ success: false, error: 'Proof not found' });
    return;
  }

  const order = await getOrderById(proof.order_id);
  if (!order) {
    res.status(404).json({ success: false, error: 'Associated order not found' });
    return;
  }

  const updatedProof = await updateProofStatus(proofId, 'CHANGES_REQUESTED', {
    change_request_notes: String(notes).trim(),
  });

  await updateOrderStatus(order.id, 'ARTWORK');

  await NotificationService.send(
    order.user_id,
    order.id,
    'PROOF_CHANGES_REQUESTED',
    `Changes Requested on v${proof.version_number}`,
    `Customer feedback: "${String(notes).trim()}". Order ${order.order_code} moved to ARTWORK revision.`
  );

  res.status(200).json({ success: true, data: updatedProof });
}
