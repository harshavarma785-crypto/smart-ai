import express from 'express';
import { getProducts, getProductById, createProduct, seedProducts } from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, adminOnly, createProduct);
router.post('/seed', seedProducts);

export default router;
