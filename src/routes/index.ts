import { Router } from 'express';
import authRoutes from './authRoutes';
import listingRoutes from './listingRoutes';
import transactionRoutes from './transactionRoutes';
import marketplaceRoutes from './marketplaceRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/listings', listingRoutes);
router.use('/transactions', transactionRoutes);
router.use('/marketplace', marketplaceRoutes);

export default router;

