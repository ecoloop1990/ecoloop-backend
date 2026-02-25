# EcoLoop Backend

Production-ready backend for EcoLoop marketplace MVP - a cloud-hosted platform connecting waste producers with recyclers.

## 🏗️ Architecture

This backend follows a clean, modular architecture with clear separation of concerns:

- **Controller Layer**: Handles HTTP requests/responses
- **Service Layer**: Business logic and orchestration
- **Repository Layer**: Data access abstraction
- **Integration Layer**: External services (S3, AI Service)

## 🚀 Tech Stack

- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt
- **File Storage**: AWS S3
- **AI Integration**: External microservice
- **Logging**: Pino
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: express-validator

## 📋 Prerequisites

- Node.js v20 or higher
- PostgreSQL 15 or higher
- AWS Account (for S3)
- Docker & Docker Compose (optional, for local development)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1
BASE_URL=http://localhost:5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecoloop?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=ecoloop-images

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=3000

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000

# API Documentation
# Swagger UI is enabled in development mode by default
# Set ENABLE_SWAGGER=true to enable in production
ENABLE_SWAGGER=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npm run prisma:seed
```

### 4. Run the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:5000`

### 5. Access Swagger Documentation

Once the server is running, visit:
```
http://localhost:5000/api/docs
```

The Swagger UI provides interactive API documentation where you can:
- View all available endpoints
- See request/response schemas
- Test API endpoints directly
- Authenticate using JWT tokens

## 🐳 Docker Setup

### Using Docker Compose (Recommended for Local Development)

```bash
# Start PostgreSQL and application
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Using Docker Only

```bash
# Build image
docker build -t ecoloop-backend .

# Run container
docker run -p 3000:3000 --env-file .env ecoloop-backend
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster configured
- kubectl configured
- Docker image pushed to registry

### Deploy

```bash
# Create secrets (update secrets.yaml.example first)
kubectl apply -f kubernetes/secrets.yaml

# Create configmap
kubectl apply -f kubernetes/configmap.yaml

# Deploy application
kubectl apply -f kubernetes/deployment.yaml

# Check status
kubectl get pods -l app=ecoloop-backend
kubectl get services
```

## 📡 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Listings

- `POST /api/v1/listings` - Create new listing (Seller only)
- `GET /api/v1/listings/feed` - Get ranked feed of listings
- `GET /api/v1/listings/:id` - Get listing by ID
- `GET /api/v1/listings/my-listings` - Get current user's listings (Seller)
- `PATCH /api/v1/listings/:id/status` - Update listing status (Seller)

### Transactions

- `POST /api/v1/transactions` - Create new transaction
- `GET /api/v1/transactions/:id` - Get transaction by ID
- `GET /api/v1/transactions/my-transactions?type=buyer|seller` - Get user's transactions
- `PATCH /api/v1/transactions/:id` - Update transaction status

### Health Check

- `GET /health` - Health check endpoint

### API Documentation

- `GET /api/docs` - Swagger UI documentation (available in development mode)

## 📝 API Request/Response Examples

### Register User

**Request:**
```json
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "userType": "INDIVIDUAL",
  "username": "johndoe",
  "termsAccepted": true
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "userType": "seller",
    "username": "johndoe"
  },
  "token": "jwt-token"
}
```

### Create Listing

**Request:**
```json
POST /api/v1/listings
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "Grade A Plastic Scrap",
  "description": "Industrial polymer, recyclable",
  "materialType": "PLASTIC",
  "quantity": 5.0,
  "unit": "tons",
  "price": 165000,
  "currency": "NGN",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "location": "Lagos, Nigeria",
  "notes": "Material is sorted and baled",
  "image": <file>
}
```

**Response:**
```json
{
  "message": "Listing created successfully",
  "listing": {
    "id": "uuid",
    "title": "Grade A Plastic Scrap",
    "materialType": "PLASTIC",
    "quantity": 5.0,
    "price": 165000,
    "imageUrl": "https://s3...",
    "status": "ACTIVE",
    ...
  }
}
```

### Get Feed (Ranked)

**Request:**
```json
GET /api/v1/listings/feed?latitude=6.5244&longitude=3.3792&radius=50&materialType=PLASTIC&limit=20
```

**Response:**
```json
{
  "listings": [...],
  "scores": [
    {
      "listingId": "uuid",
      "score": 0.85
    }
  ],
  "count": 20
}
```

## 🧮 Ranking Algorithm

The feed uses a scoring algorithm that combines:

- **Material Match (40%)**: Preference for matching material types
- **Proximity (40%)**: Distance-based scoring using Haversine formula
- **Recency (20%)**: Newer listings get higher scores

Score = (Material match × 0.4) + (Proximity × 0.4) + (Recency × 0.2)

## 🤖 AI Integration

The backend integrates with an external AI service for material classification:

- **Endpoint**: `POST /predict`
- **Payload**: `{ imageUrl: string }`
- **Response**: `{ predicted_class: string, confidence: number }`
- **Timeout**: 3 seconds
- **Fallback**: Gracefully handles AI service failures

AI predictions are logged in the `AI_Log` table for analytics.

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)
- Input validation with express-validator
- Rate limiting (100 requests per 15 minutes)
- Helmet security headers
- CORS configuration
- SQL injection protection (Prisma)

## 📊 Database Schema

### User
- id, name, email, password, role, userType, username, timestamps

### Listing
- id, sellerId, title, description, materialType, quantity, price, imageUrl, location, status, timestamps

### Transaction
- id, listingId, buyerId, sellerId, status, co2Saved, price, quantity, timestamps

### AI_Log
- id, listingId, predictedClass, confidenceScore, override, inferenceLatency, createdAt

## 🧪 Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run Prisma Studio (database GUI)
npm run prisma:studio

# Lint code
npm run lint
```

## 📦 Project Structure

```
src/
  config/          # Configuration files (database, logger, env)
  controllers/     # Request handlers
  services/        # Business logic
  repositories/    # Data access layer
  routes/          # API route definitions
  middlewares/     # Express middlewares
  utils/           # Utility functions (haversine, ranking)
  integrations/    # External service integrations (S3, AI)
  types/           # TypeScript type definitions
prisma/
  schema.prisma    # Database schema
kubernetes/        # K8s deployment files
```

## 🚨 Error Handling

The application uses a centralized error handler:

- Custom `AppError` class for operational errors
- Structured error responses
- Detailed logging for debugging
- Graceful error messages for clients

## 📈 Performance Considerations

- Database indexes on frequently queried fields
- Efficient ranking algorithm
- Connection pooling (Prisma)
- Rate limiting to prevent abuse
- Health checks for monitoring

## 🔧 Environment Variables

See `.env.example` for all required environment variables.

## 📚 API Documentation (Swagger)

- Swagger UI is available (in development or when `ENABLE_SWAGGER=true`) at:
  - `http://localhost:5000/api/docs`
- Key documented endpoints:
  - `POST /api/v1/auth/register` – registration with `userType` (`seller` | `buyer`)
  - `POST /api/v1/listings/manual` – create manual listings with image, materialType, quantity, price, currency, state
  - `POST /api/v1/listings/ai` – create AI-powered listings from an image (stores `detectedItems`, `totalWeight`, `carbonFootprint`)
  - `GET /api/v1/listings` – marketplace listings filtered by `state`, sorted by `createdAt` (DESC)

## 🛠️ CI/CD Pipeline (GitHub Actions → Docker → ECR → K8s)

This repository ships with a CI/CD workflow at `.github/workflows/backend-ci.yml`:

- **Triggers**:
  - On `push` and `pull_request` to `main`.
- **CI steps**:
  - Setup Node.js 20
  - `npm install`
  - `npm run lint`
  - `npm test`
  - `npm run build`
- **Docker & ECR** (only on `main`):
  - Logs into AWS ECR
  - Builds Docker image: `ecoloop-backend`
  - Tags image with current Git SHA
  - Pushes to `${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${GITHUB_SHA}`
- **Deploy (optional)**:
  - Uses `kubectl` with a kubeconfig provided via GitHub Secret `KUBECONFIG`
  - Updates the `ecoloop-backend` deployment image to the new ECR image
  - Waits for rollout (`kubectl rollout status`)

### Required GitHub Secrets

To use the full CI/CD pipeline, configure these repository secrets:

- `AWS_ACCESS_KEY_ID` – IAM user/role key with ECR & EKS permissions
- `AWS_SECRET_ACCESS_KEY` – secret associated with the above key
- `AWS_REGION` – AWS region (e.g. `us-east-1`)
- `AWS_ACCOUNT_ID` – AWS account ID (for ECR registry URL)
- `ECR_REPOSITORY` – name of the ECR repository for this backend
- `KUBECONFIG` – base64-encoded kubeconfig for the target cluster
- `DB_URL` – PostgreSQL connection string (e.g. AWS RDS)
- `S3_BUCKET` – S3 bucket name for file storage

## 📄 License

ISC

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use async/await (no callbacks)
3. Write clear comments
4. Follow the existing code structure
5. Test all endpoints

## 📞 Support

For issues and questions, please contact the development team.

