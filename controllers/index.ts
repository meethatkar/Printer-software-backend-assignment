/**
-- ==============================================================================
-- UNIFIED CONTROLLERS EXPORT
-- 1. AuthController (Auth & Profile)
-- 2. CatalogueController (Catalogue & Pricing)
-- 3. DesignController (Designs & Uploads)
-- 4. OrderController (Orders & Checkout)
-- 5. ProofController (Proofing & Versioning)
-- 6. PrintFileController (Print-File Engine)
-- 7. AdminController (Admin Production & Reports)
-- 8. NotificationController (Notifications)
-- ==============================================================================
*/

import * as AuthController from './authController';
import * as CatalogueController from './catalogueController';
import * as DesignController from './designController';
import * as OrderController from './orderController';
import * as ProofController from './proofController';
import * as PrintFileController from './printFileController';
import * as AdminController from './adminController';
import * as NotificationController from './notificationController';

export {
  AuthController,
  CatalogueController,
  DesignController,
  OrderController,
  ProofController,
  PrintFileController,
  AdminController,
  NotificationController,
};
