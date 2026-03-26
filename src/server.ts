import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import logger from './config/logger';
import routes from './routes';
import swaggerSpec from './config/swagger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',')
  : [];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       console.log('Incoming origin:', origin); 
    
//       if (!origin) return callback(null, true);
    
//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       } else {
//         console.log('Blocked by CORS:', origin);
//         return callback(new Error('Not allowed by CORS'));
//       }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: (_origin, callback) => {
      callback(null, true); 
    },
    credentials: true,
  })
);

// Handle preflight requests
app.use(cors({
  origin: true,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(
    {
      method: req.method,
      path: req.path,
      ip: req.ip,
    },
    'Incoming request'
  );
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger documentation (only in development or if explicitly enabled)
if (env.NODE_ENV === 'development' || process.env.ENABLE_SWAGGER === 'true') {
  // Avoid stale Swagger UI/spec in browsers/proxies
  app.use('/api/docs', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'EcoLoop API Documentation',
  }));
  logger.info('Swagger UI available at /api/docs');
}

// API routes
app.use(`/api/${env.API_VERSION}`, routes);

// Fallback route for unmatched paths
app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      environment: env.NODE_ENV,
      apiVersion: env.API_VERSION,
    },
    'Server started successfully'
  );
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;

