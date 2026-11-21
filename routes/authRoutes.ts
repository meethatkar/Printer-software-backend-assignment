import { Router } from 'express';
import { AuthController } from '../controllers';
import { requireAuth } from '../middlewares/userAuth';

const router = Router();

// Public auth endpoints
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);

// Authenticated session & profile endpoints
router.post('/logout', requireAuth, AuthController.logout);
router.get('/profile', requireAuth, AuthController.getProfile);
router.put('/profile', requireAuth, AuthController.updateProfile);

export default router;

