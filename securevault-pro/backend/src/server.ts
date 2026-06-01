import 'dotenv/config';
import { validateEnv } from './config/validateEnv';
import { createApp } from './app';
import { prisma } from './config/database';
import { logger } from './utils/logger';

// Validate all required env vars before starting
validateEnv();

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`SecureVault Pro API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection:', reason);
      shutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
