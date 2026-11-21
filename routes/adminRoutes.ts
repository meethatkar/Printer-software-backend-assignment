import { Router } from 'express';
import { AdminController, PrintFileController } from '../controllers';
import { requireAuth, requireAdmin } from '../middlewares/userAuth';

const router = Router();

// Apply auth + admin guard once for all admin endpoints
router.use(requireAuth, requireAdmin);

// Production pipeline
router.get('/orders', AdminController.listAllOrders);
router.patch('/orders/:id/advance', AdminController.advanceStage);
router.patch('/orders/:id/archive', AdminController.archiveOrder);

// Print-File Engine (Strict approval gate enforced in controller)
router.post('/orders/:orderId/generate-print', PrintFileController.generatePrintOutput);
router.get('/orders/:orderId/print-file', PrintFileController.downloadPrintFile);

// Reports & Xero export
router.get('/analytics', AdminController.getAnalytics);
router.get('/reports/xero-export', AdminController.exportXeroOrders);

// Users management (REST verbs)
router.get('/users', AdminController.listUsers);
router.patch('/users/:id/role', AdminController.updateUserRole);

// Catalogue & Templates management (REST verbs)
router.post('/products', AdminController.createProduct);
router.patch('/products/:id', AdminController.updateProduct);
router.post('/templates', AdminController.createTemplate);
router.patch('/templates/:id', AdminController.updateTemplate);

export default router;

