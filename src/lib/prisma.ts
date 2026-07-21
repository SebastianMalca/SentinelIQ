import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prismaV7: PrismaClient };

export const prisma = globalForPrisma.prismaV7 || new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString }))
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaV7 = prisma;
