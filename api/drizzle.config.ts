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
    "./src/db/professional-profile-schema.ts",
    "./src/db/dispatch-capability-schema.ts",
    "./src/db/compliance-record-schema.ts",
    "./src/db/job-schema.ts",
    "./src/db/job-notes-schema.ts",
    "./src/db/job-attachment-schema.ts",
    "./src/db/job-cost-breakdown-schema.ts",
    "./src/db/work-request-attempt-schema.ts",
    "./src/db/claim-schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
