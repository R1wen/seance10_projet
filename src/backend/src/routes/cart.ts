import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cartController';

const router = Router();

router.get('/', authenticate, getCart);
router.post('/', authenticate, addToCart);
router.put('/:productId', authenticate, updateCartItem);
router.delete('/:productId', authenticate, removeCartItem);

export default router;
