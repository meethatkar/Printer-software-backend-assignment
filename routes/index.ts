/**
-- ==============================================================================
-- ROOT ROUTE AGGREGATOR
-- Mounts all domain sub-routers under /api
-- ==============================================================================
*/

import { Router } from 'express';
import authRoutes from './authRoutes';
import catalogueRoutes from './catalogueRoutes';
import designRoutes from './designRoutes';
import orderRoutes from './orderRoutes';
import proofRoutes from './proofRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/catalogue', catalogueRoutes);
router.use('/designs', designRoutes);
router.use('/orders', orderRoutes);
router.use('/proofs', proofRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
