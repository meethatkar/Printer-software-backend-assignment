import { Router } from 'express';
import { ProofController } from '../controllers';
import { requireAuth } from '../middlewares/userAuth';

const router = Router();

// Customer & Admin proof approval gate & change requests
router.post('/:proofId/approve', requireAuth, ProofController.approveProof);
router.post('/:proofId/request-changes', requireAuth, ProofController.requestChanges);

export default router;

