import { relations } from "drizzle-orm";
import { asset } from "./asset-schema.js";
import { building } from "./building-schema.js";
import { checklistResult } from "./checklist-result-schema.js";
import { checklistRun } from "./checklist-run-schema.js";
import { checklistTemplate } from "./checklist-template-schema.js";
import { checklistTemplateItem } from "./checklist-template-item-schema.js";
import { claim } from "./claim-schema.js";
import { complianceRecord } from "./compliance-record-schema.js";
import { dispatchCapability } from "./dispatch-capability-schema.js";
import { event } from "./event-schema.js";
import { eventRecipient } from "./event-recipient-schema.js";
import { job } from "./job-schema.js";
import { jobAttachment } from "./job-attachment-schema.js";
import { jobCostBreakdown } from "./job-cost-breakdown-schema.js";
import { jobNotes } from "./job-notes-schema.js";
import { membership } from "./membership-schema.js";
import { professionalProfile } from "./professional-profile-schema.js";
import { property } from "./property-schema.js";
import { unit } from "./unit-schema.js";
import { workRequestAttempt } from "./work-request-attempt-schema.js";

// property <-> building <-> unit one-to-many chains, so query code can use
// Drizzle's relational query API instead of hand-written joins. Kept in a
// standalone file (rather than alongside each table) since these three
// tables reference each other bidirectionally.
//
// `asset` and `stake` are deliberately NOT related here — their
// `subjectType`/`subjectId` polymorphic pair isn't a real foreign key (see
// the comments on asset-schema.ts and stake-schema.ts) and is resolved at
// the application layer per subject type instead.
export const propertyRelations = relations(property, ({ many }) => ({
  buildings: many(building),
}));

export const buildingRelations = relations(building, ({ one, many }) => ({
  property: one(property, {
    fields: [building.propertyId],
    references: [property.id],
  }),
  units: many(unit),
  checklistRuns: many(checklistRun),
}));

export const unitRelations = relations(unit, ({ one }) => ({
  building: one(building, {
    fields: [unit.buildingId],
    references: [building.id],
  }),
}));

// Professional-capability layer — all three tables are 1:1 extensions of
// `membership`, same shape as `professionalProfile`/`dispatchCapability`
// themselves (PK = membership_id). `complianceRecord` is many-per-membership
// instead.
export const membershipRelations = relations(membership, ({ one, many }) => ({
  professionalProfile: one(professionalProfile, {
    fields: [membership.id],
    references: [professionalProfile.membershipId],
  }),
  dispatchCapability: one(dispatchCapability, {
    fields: [membership.id],
    references: [dispatchCapability.membershipId],
  }),
  complianceRecords: many(complianceRecord),
  checklistRuns: many(checklistRun),
}));

export const professionalProfileRelations = relations(professionalProfile, ({ one }) => ({
  membership: one(membership, {
    fields: [professionalProfile.membershipId],
    references: [membership.id],
  }),
}));

export const dispatchCapabilityRelations = relations(dispatchCapability, ({ one }) => ({
  membership: one(membership, {
    fields: [dispatchCapability.membershipId],
    references: [membership.id],
  }),
}));

export const complianceRecordRelations = relations(complianceRecord, ({ one }) => ({
  membership: one(membership, {
    fields: [complianceRecord.membershipId],
    references: [membership.id],
  }),
}));

// job <-> its four extensions. `job.subjectType`/`subjectId` is
// deliberately NOT related here — see the comment on job-schema.ts (same
// poly pattern as asset/stake: the target table depends on subjectType and
// is resolved at the application layer, not via a real FK).
export const jobRelations = relations(job, ({ one, many }) => ({
  notes: one(jobNotes, {
    fields: [job.id],
    references: [jobNotes.jobId],
  }),
  costBreakdown: one(jobCostBreakdown, {
    fields: [job.id],
    references: [jobCostBreakdown.jobId],
  }),
  attachments: many(jobAttachment),
  workRequestAttempts: many(workRequestAttempt),
}));

export const jobNotesRelations = relations(jobNotes, ({ one }) => ({
  job: one(job, {
    fields: [jobNotes.jobId],
    references: [job.id],
  }),
}));

export const jobAttachmentRelations = relations(jobAttachment, ({ one }) => ({
  job: one(job, {
    fields: [jobAttachment.jobId],
    references: [job.id],
  }),
}));

export const jobCostBreakdownRelations = relations(jobCostBreakdown, ({ one }) => ({
  job: one(job, {
    fields: [jobCostBreakdown.jobId],
    references: [job.id],
  }),
}));

export const workRequestAttemptRelations = relations(workRequestAttempt, ({ one }) => ({
  job: one(job, {
    fields: [workRequestAttempt.jobId],
    references: [job.id],
  }),
}));

// claim <-> building is a real, single-target, nullable FK — not the
// subject_type/subject_id poly pattern — so it's wired as a normal
// optional one() relation, same as building <-> property above. (tasks.md
// 5.2 originally grouped this with Job's poly comment and called for
// leaving it unwired "to match asset/stake"; that doesn't hold once you
// look at the actual column shape — building_id has one fixed target
// table and a real FK, which is exactly what Drizzle relations are for.
// Flagged as a deliberate deviation from the literal task wording, not an
// oversight.)
export const claimRelations = relations(claim, ({ one }) => ({
  building: one(building, {
    fields: [claim.buildingId],
    references: [building.id],
  }),
}));

// checklist_template <-> checklist_template_item (one-to-many), and
// checklist_run <-> checklist_result (one-to-many), plus the plain FK
// relations checklist_run -> building/membership/checklist_template and
// checklist_result -> checklist_template_item/asset. None of these are
// polymorphic — every one is a real, single-target FK — so all are wired
// normally, same reasoning as `claimRelations` above.
//
// Deliberately NOT related: checklist_run/checklist_result to job/claim —
// design.md's own Non-Goals name this exact omission. Neither design doc
// ever states that relationship exists, so none is invented here.
export const checklistTemplateRelations = relations(checklistTemplate, ({ many }) => ({
  items: many(checklistTemplateItem),
}));

export const checklistTemplateItemRelations = relations(checklistTemplateItem, ({ one }) => ({
  checklistTemplate: one(checklistTemplate, {
    fields: [checklistTemplateItem.checklistTemplateId],
    references: [checklistTemplate.id],
  }),
}));

export const checklistRunRelations = relations(checklistRun, ({ one, many }) => ({
  building: one(building, {
    fields: [checklistRun.buildingId],
    references: [building.id],
  }),
  membership: one(membership, {
    fields: [checklistRun.membershipId],
    references: [membership.id],
  }),
  checklistTemplate: one(checklistTemplate, {
    fields: [checklistRun.checklistTemplateId],
    references: [checklistTemplate.id],
  }),
  results: many(checklistResult),
}));

export const checklistResultRelations = relations(checklistResult, ({ one }) => ({
  checklistRun: one(checklistRun, {
    fields: [checklistResult.checklistRunId],
    references: [checklistRun.id],
  }),
  checklistTemplateItem: one(checklistTemplateItem, {
    fields: [checklistResult.checklistTemplateItemId],
    references: [checklistTemplateItem.id],
  }),
  asset: one(asset, {
    fields: [checklistResult.assetId],
    references: [asset.id],
  }),
}));

export const assetRelations = relations(asset, ({ many }) => ({
  checklistResults: many(checklistResult),
}));

// event <-> event_recipient (one-to-many). `event.subjectType`/`subjectId`
// is deliberately NOT related here — see the comment on event-schema.ts
// (same poly pattern as asset/stake/job: the target table depends on
// subjectType and is resolved at the application layer, not via a real FK).
export const eventRelations = relations(event, ({ many }) => ({
  recipients: many(eventRecipient),
}));

export const eventRecipientRelations = relations(eventRecipient, ({ one }) => ({
  event: one(event, {
    fields: [eventRecipient.eventId],
    references: [event.id],
  }),
}));
