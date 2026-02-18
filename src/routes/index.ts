import { Router } from 'express';
import authRoutes from './authRoutes';
import listingRoutes from './listingRoutes';
import transactionRoutes from './transactionRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/listings', listingRoutes);
router.use('/transactions', transactionRoutes);

export default router;

