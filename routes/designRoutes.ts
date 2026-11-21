import { Router } from 'express';
import { DesignController } from '../controllers';
import { requireAuth, requireRole } from '../middlewares/userAuth';

const router = Router();

// Authenticated design management
router.use(requireAuth);

router.get('/', DesignController.listMyDesigns);
router.post('/', DesignController.saveDesign);
router.post('/upload', DesignController.uploadArtwork);
router.post('/parse-csv', DesignController.parseCsvVariables);

export default router;

