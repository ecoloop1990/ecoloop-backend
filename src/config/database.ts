import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: unknown) => {
    logger.debug({ query: e }, 'Database query');
  });
}

prisma.$on('error' as never, (e: unknown) => {
  logger.error({ error: e }, 'Database error');
});

prisma.$on('warn' as never, (e: unknown) => {
  logger.warn({ warning: e }, 'Database warning');
});

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default prisma;

