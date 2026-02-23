import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoLoop API',
      version: '1.0.0',
      description: 'Industrial Waste Marketplace Backend API',
      contact: {
        name: 'EcoLoop API Support',
      },
    },
    servers: [
      {
        url: env.BASE_URL,
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/v1/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'confirmPassword', 'userType', 'termsAccepted'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Must contain at least one uppercase, one lowercase, and one number',
              example: 'SecurePass123',
            },
            confirmPassword: {
              type: 'string',
              example: 'SecurePass123',
            },
            userType: {
              type: 'string',
              enum: ['seller', 'buyer'],
              description: 'User role (seller or buyer, case-insensitive)',
              example: 'seller',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9_]+$',
              description: 'Optional: Unique username',
              example: 'johndoe',
            },
            termsAccepted: {
              type: 'boolean',
              example: true,
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              example: 'SecurePass123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                name: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
                role: {
                  type: 'string',
                  enum: ['seller', 'buyer'],
                  example: 'buyer',
                },
                username: {
                  type: 'string',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
            token: {
              type: 'string',
              description: 'JWT token for authentication',
            },
          },
        },
        CreateListingRequest: {
          type: 'object',
          required: ['title', 'price', 'createType'],
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
              example: 'Grade A Plastic Scrap',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              example: 'Industrial polymer, recyclable',
            },
            createType: {
              type: 'string',
              enum: ['ai', 'manual'],
              description: 'Creation type: "ai" for AI analysis or "manual" for manual entry',
              example: 'ai',
            },
            materialType: {
              type: 'string',
              enum: ['WOOD', 'METAL', 'PLASTIC', 'GLASS', 'CARDBOARD', 'BIODEGRADABLE'],
              description: 'Required for manual creation, optional for AI',
              example: 'PLASTIC',
            },
            quantity: {
              type: 'number',
              minimum: 0.01,
              description: 'Optional: Will be set from AI analysis if createType is "ai"',
              example: 5.0,
            },
            weight: {
              type: 'number',
              minimum: 0.01,
              description: 'Required for manual creation',
              example: 50,
            },
            material: {
              type: 'string',
              maxLength: 100,
              description: 'Required for manual creation',
              example: 'Plastic',
            },
            unit: {
              type: 'string',
              enum: ['kg', 'tons', 'lbs', 'pieces'],
              default: 'kg',
              example: 'tons',
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 165000,
            },
            currency: {
              type: 'string',
              minLength: 3,
              maxLength: 3,
              default: 'NGN',
              example: 'NGN',
            },
            latitude: {
              type: 'number',
              minimum: -90,
              maximum: 90,
              example: 6.5244,
            },
            longitude: {
              type: 'number',
              minimum: -180,
              maximum: 180,
              example: 3.3792,
            },
            location: {
              type: 'string',
              maxLength: 200,
              example: 'Lagos, Nigeria',
            },
            state: {
              type: 'string',
              maxLength: 100,
              example: 'lagos',
            },
            notes: {
              type: 'string',
              maxLength: 1000,
              example: 'Material is sorted and baled',
            },
          },
        },
        Listing: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            materialType: {
              type: 'string',
              enum: ['WOOD', 'METAL', 'PLASTIC', 'GLASS', 'CARDBOARD', 'BIODEGRADABLE'],
            },
            quantity: {
              type: 'number',
            },
            unit: {
              type: 'string',
            },
            price: {
              type: 'number',
            },
            currency: {
              type: 'string',
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
            },
            latitude: {
              type: 'number',
            },
            longitude: {
              type: 'number',
            },
            location: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'PENDING', 'COMPLETED', 'SOLD', 'CANCELLED'],
            },
            notes: {
              type: 'string',
            },
            co2Saved: {
              type: 'number',
            },
            recyclability: {
              type: 'number',
            },
            createType: {
              type: 'string',
              enum: ['ai', 'manual'],
              example: 'ai',
            },
            detectedItems: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Items detected by AI analysis',
              example: ['plastic bottle', 'aluminum can'],
            },
            totalWeight: {
              type: 'number',
              description: 'Total weight from AI analysis',
              example: 5.2,
            },
            carbonFootprint: {
              type: 'number',
              description: 'Carbon footprint from AI analysis',
              example: 12.5,
            },
            state: {
              type: 'string',
              example: 'lagos',
            },
            seller: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                name: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
                username: {
                  type: 'string',
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        FeedResponse: {
          type: 'object',
          properties: {
            listings: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Listing',
              },
            },
            scores: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  listingId: {
                    type: 'string',
                    format: 'uuid',
                  },
                  score: {
                    type: 'number',
                    description: 'Ranking score between 0 and 1',
                  },
                },
              },
            },
            count: {
              type: 'number',
            },
          },
        },
        UpdateListingStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['active', 'pending', 'completed', 'sold', 'cancelled'],
              example: 'COMPLETED',
            },
          },
        },
        CreateTransactionRequest: {
          type: 'object',
          required: ['listingId', 'quantity'],
          properties: {
            listingId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            quantity: {
              type: 'number',
              minimum: 0.01,
              example: 2.5,
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            listingId: {
              type: 'string',
              format: 'uuid',
            },
            buyerId: {
              type: 'string',
              format: 'uuid',
            },
            sellerId: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'cancelled', 'failed'],
            },
            price: {
              type: 'number',
            },
            quantity: {
              type: 'number',
            },
            co2Saved: {
              type: 'number',
            },
            listing: {
              $ref: '#/components/schemas/Listing',
            },
            buyer: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                name: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
                username: {
                  type: 'string',
                },
              },
            },
            seller: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                name: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
                username: {
                  type: 'string',
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        UpdateTransactionStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'],
              example: 'COMPLETED',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Listings',
        description: 'Listing management endpoints',
      },
      {
        name: 'Feed',
        description: 'Feed and discovery endpoints',
      },
      {
        name: 'Transactions',
        description: 'Transaction management endpoints',
      },
    ],
  },
  // In dev we load annotations from TS. In production build, load from dist JS.
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

