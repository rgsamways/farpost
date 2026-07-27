import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as appSchema from "./schema.js";
import * as authSchema from "./auth-schema.js";
import * as membershipSchema from "./membership-schema.js";
import * as roleTypeSchema from "./role-type-schema.js";
import * as propertySchema from "./property-schema.js";
import * as buildingSchema from "./building-schema.js";
import * as unitSchema from "./unit-schema.js";
import * as assetSchema from "./asset-schema.js";
import * as stakeSchema from "./stake-schema.js";
import * as relationsSchema from "./relations.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const schema = {
  ...appSchema,
  ...authSchema,
  ...membershipSchema,
  ...roleTypeSchema,
  ...propertySchema,
  ...buildingSchema,
  ...unitSchema,
  ...assetSchema,
  ...stakeSchema,
  ...relationsSchema,
};

export const db = drizzle(pool, { schema });
