import { Router } from 'express';
import { CatalogueController } from '../controllers';

const router = Router();

// Public catalogue & quoting endpoints
router.get('/divisions', CatalogueController.getDivisions);
router.get('/products/:slug', CatalogueController.getProductBySlug);
router.get('/gallery', CatalogueController.getGallery);
router.post('/calculate-price', CatalogueController.calculatePrice);

export default router;

