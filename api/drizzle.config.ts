import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/db/schema.ts",
    "./src/db/auth-schema.ts",
    "./src/db/membership-schema.ts",
    "./src/db/role-type-schema.ts",
    "./src/db/property-schema.ts",
    "./src/db/building-schema.ts",
    "./src/db/unit-schema.ts",
    "./src/db/asset-schema.ts",
    "./src/db/stake-schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
