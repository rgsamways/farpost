import { sql } from "drizzle-orm";
import { check, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { membership } from "./membership-schema.js";

// Many-per-membership credential/licensing record (e.g. WSIB, ESA of
// Ontario). `verification_status`'s vocabulary was invented during this
// change's design (design.md's "genuine judgment call, not a
// transcription" note) — not sourced from a prior doc. Flagged here so a
// future pass can revisit it deliberately rather than assuming it's
// settled.
export const COMPLIANCE_VERIFICATION_STATUS_VALUES = [
  "pending",
  "verified",
  "expired",
  "rejected",
] as const;

export const complianceRecord = pgTable(
  "compliance_record",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => membership.id, { onDelete: "restrict" }),
    credentialType: text("credential_type").notNull(),
    referenceNumber: text("reference_number"),
    expiryDate: date("expiry_date"),
    verificationStatus: text("verification_status", {
      enum: COMPLIANCE_VERIFICATION_STATUS_VALUES,
    }).notNull(),
    issuingAuthority: text("issuing_authority"),
    verificationDocumentUrl: text("verification_document_url"),
    renewalReminderSentAt: timestamp("renewal_reminder_sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "compliance_record_verification_status_check",
      sql`${table.verificationStatus} IN (${sql.raw(COMPLIANCE_VERIFICATION_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    index("compliance_record_membership_id_idx").on(table.membershipId),
    index("compliance_record_expiry_due_idx")
      .on(table.expiryDate)
      .where(sql`${table.expiryDate} IS NOT NULL`),
  ],
);
