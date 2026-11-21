import { Router } from 'express';
import { NotificationController } from '../controllers';
import { requireAuth } from '../middlewares/userAuth';

const router = Router();

// Authenticated user notifications
router.use(requireAuth);

router.get('/', NotificationController.listMyNotifications);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;

