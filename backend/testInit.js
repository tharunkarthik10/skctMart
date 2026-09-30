import { PrismaClient } from '@prisma/client';

try {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  console.log("Prisma initialized successfully!");
} catch (e) {
  console.error(e);
}
