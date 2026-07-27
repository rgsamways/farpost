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
import * as professionalProfileSchema from "./professional-profile-schema.js";
import * as dispatchCapabilitySchema from "./dispatch-capability-schema.js";
import * as complianceRecordSchema from "./compliance-record-schema.js";
import * as jobSchema from "./job-schema.js";
import * as jobNotesSchema from "./job-notes-schema.js";
import * as jobAttachmentSchema from "./job-attachment-schema.js";
import * as jobCostBreakdownSchema from "./job-cost-breakdown-schema.js";
import * as workRequestAttemptSchema from "./work-request-attempt-schema.js";
import * as claimSchema from "./claim-schema.js";
import * as checklistTemplateSchema from "./checklist-template-schema.js";
import * as checklistTemplateItemSchema from "./checklist-template-item-schema.js";
import * as checklistRunSchema from "./checklist-run-schema.js";
import * as checklistResultSchema from "./checklist-result-schema.js";
import * as eventSchema from "./event-schema.js";
import * as eventRecipientSchema from "./event-recipient-schema.js";
import * as notificationSubscriptionSchema from "./notification-subscription-schema.js";
import * as factStalenessSchema from "./fact-staleness-schema.js";
import * as contributionSchema from "./contribution-schema.js";
import * as scoutVisitSchema from "./scout-visit-schema.js";
import * as billingSubscriptionSchema from "./billing-subscription-schema.js";
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
  ...professionalProfileSchema,
  ...dispatchCapabilitySchema,
  ...complianceRecordSchema,
  ...jobSchema,
  ...jobNotesSchema,
  ...jobAttachmentSchema,
  ...jobCostBreakdownSchema,
  ...workRequestAttemptSchema,
  ...claimSchema,
  ...checklistTemplateSchema,
  ...checklistTemplateItemSchema,
  ...checklistRunSchema,
  ...checklistResultSchema,
  ...eventSchema,
  ...eventRecipientSchema,
  ...notificationSubscriptionSchema,
  ...factStalenessSchema,
  ...contributionSchema,
  ...scoutVisitSchema,
  ...billingSubscriptionSchema,
  ...relationsSchema,
};

export const db = drizzle(pool, { schema });
