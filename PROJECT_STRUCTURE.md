# EcoLoop Backend - Project Structure

## 📁 Directory Structure

```
ecoloop/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # Prisma client setup
│   │   ├── env.ts          # Environment variables
│   │   └── logger.ts       # Pino logger configuration
│   │
│   ├── controllers/         # Request handlers (HTTP layer)
│   │   ├── authController.ts
│   │   ├── listingController.ts
│   │   └── transactionController.ts
│   │
│   ├── services/            # Business logic layer
│   │   ├── authService.ts
│   │   ├── listingService.ts
│   │   └── transactionService.ts
│   │
│   ├── repositories/        # Data access layer
│   │   ├── userRepository.ts
│   │   ├── listingRepository.ts
│   │   ├── transactionRepository.ts
│   │   └── aiLogRepository.ts
│   │
│   ├── routes/              # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── listingRoutes.ts
│   │   ├── transactionRoutes.ts
│   │   └── index.ts
│   │
│   ├── middlewares/         # Express middlewares
│   │   ├── authMiddleware.ts    # JWT authentication
│   │   ├── errorHandler.ts      # Error handling
│   │   ├── uploadMiddleware.ts  # File upload (multer)
│   │   └── validationMiddleware.ts  # Request validation
│   │
│   ├── integrations/        # External service integrations
│   │   ├── s3.ts            # AWS S3 file storage
│   │   └── aiService.ts     # AI microservice client
│   │
│   ├── utils/               # Utility functions
│   │   ├── haversine.ts     # Distance calculations
│   │   └── ranking.ts       # Feed ranking algorithm
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   │
│   └── server.ts            # Express app entry point
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeding script
│
├── kubernetes/              # Kubernetes deployment files
│   ├── deployment.yaml
│   ├── configmap.yaml
│   └── secrets.yaml.example
│
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .eslintrc.json
├── .gitignore
├── .dockerignore
├── .nvmrc
├── env.example
├── setup.sh
├── README.md
├── API_OBJECT_KEYS.md
└── PROJECT_STRUCTURE.md
```

## 🏗️ Architecture Layers

### 1. **Controller Layer** (`src/controllers/`)
- Handles HTTP requests and responses
- Validates request data
- Calls service layer
- Returns formatted responses

### 2. **Service Layer** (`src/services/`)
- Contains business logic
- Orchestrates multiple repositories
- Handles external service calls (S3, AI)
- Implements ranking algorithms

### 3. **Repository Layer** (`src/repositories/`)
- Abstracts database operations
- Uses Prisma ORM
- Provides clean data access interface
- No business logic

### 4. **Integration Layer** (`src/integrations/`)
- External service clients
- AWS S3 for file storage
- AI service for material classification
- Handles timeouts and errors gracefully

## 🔄 Request Flow

```
HTTP Request
    ↓
Route Handler (routes/)
    ↓
Validation Middleware
    ↓
Authentication Middleware (if protected)
    ↓
Controller (controllers/)
    ↓
Service (services/)
    ↓
Repository (repositories/)
    ↓
Database (Prisma)
    ↓
Response
```

## 📊 Database Models

### User
- Authentication and user profile
- Roles: SELLER, BUYER
- Types: INDIVIDUAL, COMPANY

### Listing
- Waste material listings
- Material types: WOOD, METAL, PLASTIC, GLASS, CARDBOARD, ELECTRONICS, TEXTILES, OTHER
- Status: ACTIVE, PENDING, COMPLETED, SOLD, CANCELLED
- Location data for proximity ranking

### Transaction
- Purchase transactions
- Links buyers and sellers
- Tracks CO2 savings
- Status: PENDING, COMPLETED, CANCELLED, FAILED

### AI_Log
- AI prediction history
- Confidence scores
- Override tracking
- Performance metrics (latency)

## 🔐 Security Features

- **JWT Authentication**: Token-based auth
- **Password Hashing**: bcrypt with 10 rounds
- **Role-Based Access**: SELLER/BUYER roles
- **Input Validation**: express-validator
- **Rate Limiting**: 100 requests per 15 minutes
- **Helmet**: Security headers
- **CORS**: Configured origins

## 🚀 Deployment Options

### 1. Local Development
```bash
npm install
npx prisma migrate dev
npm run dev
```

### 2. Docker Compose
```bash
docker-compose up -d
```

### 3. Kubernetes
```bash
kubectl apply -f kubernetes/
```

## 📈 Performance Features

- Database indexes on frequently queried fields
- Efficient Haversine distance calculations
- Ranking algorithm optimized for feed generation
- Connection pooling (Prisma)
- Health check endpoints
- Structured logging for monitoring

## 🧪 Testing Strategy

- Unit tests: Services and utilities
- Integration tests: API endpoints
- E2E tests: Full user flows
- Load tests: Performance under load

## 📝 Code Standards

- TypeScript strict mode
- No `any` types
- Async/await (no callbacks)
- Clear error handling
- Comprehensive logging
- Production-ready error messages

## 🔧 Environment Variables

See `env.example` for all required variables:
- Database connection
- JWT secrets
- AWS credentials
- AI service URL
- Logging configuration
- Rate limiting settings

## 📚 Documentation

- **README.md**: Setup and usage guide
- **API_OBJECT_KEYS.md**: API request/response schemas
- **PROJECT_STRUCTURE.md**: This file
- Inline code comments for complex logic

