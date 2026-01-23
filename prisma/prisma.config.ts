import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),

  migrate: {
    async adapter() {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set");
      }

      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { Pool } = await import("pg");

      const pool = new Pool({ connectionString });
      return new PrismaPg(pool);
    },
  },
});
