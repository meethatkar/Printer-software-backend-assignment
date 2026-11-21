import { Router } from 'express';
import { OrderController, ProofController } from '../controllers';
import { requireAuth, requireRole } from '../middlewares/userAuth';

const router = Router();

// Customer order & checkout routes (accessible by any authenticated user)
router.post('/', requireAuth, OrderController.createOrder);
router.get('/', requireAuth, OrderController.listMyOrders);
router.get('/:id', requireAuth, OrderController.getMyOrder);
router.post('/:id/reorder', requireAuth, OrderController.reorderOrder);
router.get('/:id/invoice', requireAuth, OrderController.downloadInvoice);

// Nested proof revision routes (Customer & Admin)
router.get('/:orderId/proofs', requireAuth, ProofController.getOrderProofs);
router.post('/:orderId/proofs', requireAuth, ProofController.createProofRevision);

export default router;

