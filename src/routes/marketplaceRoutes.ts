import { Router } from 'express';
import { query } from 'express-validator';
import { getMarketplace } from '../controllers/marketplaceController';
import { validate } from '../middlewares/validationMiddleware';

const router = Router();

/**
 * @swagger
 * /api/v1/marketplace:
 *   get:
 *     summary: Get marketplace listings filtered by state
 *     tags: [Feed]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state (e.g., "lagos", "abuja")
 *         example: "lagos"
 *     responses:
 *       200:
 *         description: Marketplace listings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 *                 count:
 *                   type: number
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const marketplaceQueryValidation = [
  query('state')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters'),
];

router.get('/', validate(marketplaceQueryValidation), getMarketplace);

export default router;

