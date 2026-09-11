import { PrismaClient } from '@prisma/client';
import config from '../config/env.js';

// Prevent multiple instances of Prisma Client in development (Hot Reloading / Nodemon)
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
