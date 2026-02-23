import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createListing,
  getListingById,
  getFeed,
  updateListingStatus,
  getMyListings,
} from '../controllers/listingController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import { MaterialType, ListingStatus } from '@prisma/client';

const router = Router();

const createListingValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('createType')
    .notEmpty()
    .withMessage('createType is required')
    .isIn(['ai', 'manual'])
    .withMessage('createType must be either "ai" or "manual"'),
  body('materialType')
    .optional()
    .isIn(Object.values(MaterialType))
    .withMessage('Invalid material type'),
  body('quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('weight')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Weight must be greater than 0'),
  body('material')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Material must not exceed 100 characters'),
  body('unit')
    .optional()
    .isIn(['kg', 'tons', 'lbs', 'pieces'])
    .withMessage('Invalid unit'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than or equal to 0'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must not exceed 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

const updateStatusValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid listing ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(ListingStatus))
    .withMessage('Invalid status'),
];

const feedQueryValidation = [
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  query('radius')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Radius must be greater than or equal to 0'),
  query('materialType')
    .optional()
    .isIn(Object.values(MaterialType))
    .withMessage('Invalid material type'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be greater than or equal to 0'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be greater than or equal to 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be greater than or equal to 0'),
];

/**
 * @swagger
 * /api/v1/listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *               - createType
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Material image (JPEG, PNG, WebP, max 10MB) - Required for AI creation
 *               title:
 *                 type: string
 *                 example: "Grade A Plastic Scrap"
 *               description:
 *                 type: string
 *                 example: "Industrial polymer, recyclable"
 *               createType:
 *                 type: string
 *                 enum: [ai, manual]
 *                 description: "Creation type: 'ai' for AI analysis or 'manual' for manual entry"
 *                 example: "ai"
 *               materialType:
 *                 type: string
 *                 enum: [WOOD, METAL, PLASTIC, GLASS, CARDBOARD, ELECTRONICS, TEXTILES, OTHER]
 *                 description: "Required for manual, optional for AI"
 *                 example: "PLASTIC"
 *               quantity:
 *                 type: number
 *                 example: 5.0
 *               unit:
 *                 type: string
 *                 enum: [kg, tons, lbs, pieces]
 *                 example: "tons"
 *               price:
 *                 type: number
 *                 example: 165000
 *               currency:
 *                 type: string
 *                 example: "NGN"
 *               latitude:
 *                 type: number
 *                 example: 6.5244
 *               longitude:
 *                 type: number
 *                 example: 3.3792
 *               location:
 *                 type: string
 *                 example: "Lagos, Nigeria"
 *               notes:
 *                 type: string
 *                 example: "Material is sorted and baled"
 *     responses:
 *       201:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Listing created successfully"
 *                 listing:
 *                   $ref: '#/components/schemas/Listing'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - SELLER role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Protected routes
router.post(
  '/',
  authenticate,
  authorize('seller'),
  upload.single('image'),
  validate(createListingValidation),
  createListing
);

/**
 * @swagger
 * /api/v1/listings/feed:
 *   get:
 *     summary: Get ranked feed of listings
 *     description: Returns a ranked list of listings based on material match, proximity, and recency
 *     tags: [Feed]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: User's latitude for proximity ranking
 *         example: 6.5244
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: User's longitude for proximity ranking
 *         example: 3.3792
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Search radius in kilometers
 *         example: 50
 *       - in: query
 *         name: materialType
 *         schema:
 *           type: string
 *           enum: [WOOD, METAL, PLASTIC, GLASS, CARDBOARD, ELECTRONICS, TEXTILES, OTHER]
 *         description: Filter by material type
 *         example: "PLASTIC"
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *         example: 1000
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *         example: 200000
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of results to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Pagination offset
 *         example: 0
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeedResponse'
 *             example:
 *               listings:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   title: "Grade A Plastic Scrap"
 *                   materialType: "PLASTIC"
 *                   quantity: 5.0
 *                   price: 165000
 *                   status: "ACTIVE"
 *               scores:
 *                 - listingId: "123e4567-e89b-12d3-a456-426614174000"
 *                   score: 0.85
 *               count: 1
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/feed', validate(feedQueryValidation), getFeed);

/**
 * @swagger
 * /api/v1/listings/my-listings:
 *   get:
 *     summary: Get current user's listings
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listings retrieved successfully
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
 *                   example: 5
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/my-listings', authenticate, getMyListings);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Listing ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Listing retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listing:
 *                   $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Listing not found"
 */
router.get(
  '/:id',
  param('id').isUUID().withMessage('Invalid listing ID'),
  getListingById
);

/**
 * @swagger
 * /api/v1/listings/{id}/status:
 *   patch:
 *     summary: Update listing status
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Listing ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateListingStatusRequest'
 *     responses:
 *       200:
 *         description: Listing status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Listing status updated successfully"
 *                 listing:
 *                   $ref: '#/components/schemas/Listing'
 *       400:
 *         description: Validation error or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - SELLER role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('seller'),
  validate(updateStatusValidation),
  updateListingStatus
);

export default router;

