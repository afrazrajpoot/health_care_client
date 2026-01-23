import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

// Create a connection pool
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

// Store pool in global to reuse
globalForPrisma.pool = pool;

// Create adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  });

// Store in global to prevent multiple instances (both dev and production)
globalForPrisma.prisma = prisma;

// Helper function to ensure connection before queries
export async function ensurePrismaConnection() {
  try {
    await prisma.$connect();
  } catch (error: any) {
    // Ignore "already connected" errors - this is expected
    const isConnectedError =
      error?.message?.includes("already connected") ||
      error?.message?.includes("Already connected");

    if (!isConnectedError) {
      console.error("❌ Prisma connection failed:", error);
      // We should probably throw here so the API route knows it failed
      throw error;
    }
  }
}
