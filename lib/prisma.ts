// Import from the custom generated client path as defined in prisma/schema.prisma
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isDev = process.env.NODE_ENV !== 'production';

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: isDev ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
