CREATE TABLE "professional_profile" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company" text,
	"slug" text NOT NULL,
	"phone" text,
	"service_area" jsonb,
	"visibility" jsonb,
	"stripe_customer_id" text,
	"underwriting_digest_enabled" boolean DEFAULT false NOT NULL,
	"extra" jsonb,
	"years_in_business" integer,
	"bio_text" text,
	CONSTRAINT "professional_profile_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dispatch_capability" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"eligible" boolean DEFAULT false NOT NULL,
	"base_lat" numeric,
	"base_lng" numeric,
	"service_radius_km" numeric,
	"service_postal_prefixes" text[],
	"max_drive_minutes" integer,
	"capabilities" text[],
	"capacity_current" integer DEFAULT 0 NOT NULL,
	"capacity_max" integer
);
--> statement-breakpoint
CREATE TABLE "compliance_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"credential_type" text NOT NULL,
	"reference_number" text,
	"expiry_date" date,
	"verification_status" text NOT NULL,
	"issuing_authority" text,
	"verification_document_url" text,
	"renewal_reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_record_verification_status_check" CHECK ("compliance_record"."verification_status" IN ('pending', 'verified', 'expired', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_user_id" text NOT NULL,
	"target_role" text NOT NULL,
	"assignee_user_id" text,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"description" text NOT NULL,
	"accepted_at" timestamp,
	"arrived_at" timestamp,
	"completed_at" timestamp,
	"approved_at" timestamp,
	"scheduled_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"scope_notes" text,
	"report_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_subject_type_check" CHECK ("job"."subject_type" IN ('claim', 'building', 'property', 'asset')),
	CONSTRAINT "job_status_check" CHECK ("job"."status" IN ('pending', 'dispatched', 'accepted', 'in_progress', 'documented', 'approved', 'paid', 'exhausted', 'cancelled')),
	CONSTRAINT "job_priority_check" CHECK ("job"."priority" IN ('low', 'medium', 'high', 'urgent'))
);
--> statement-breakpoint
CREATE TABLE "job_notes" (
	"job_id" uuid PRIMARY KEY NOT NULL,
	"requester_notes" text,
	"assignee_notes" text
);
--> statement-breakpoint
CREATE TABLE "job_attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"doc_type" text NOT NULL,
	"label" text,
	"url" text NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
	"mimetype" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_cost_breakdown" (
	"job_id" uuid PRIMARY KEY NOT NULL,
	"labour_hours" numeric,
	"labour_rate" numeric,
	"materials" numeric,
	"equipment" numeric,
	"travel" numeric,
	"total" numeric,
	"tax_rate" numeric,
	"tax_amount" numeric,
	"breakdown_type" text NOT NULL,
	"measurement_notes" text,
	CONSTRAINT "job_cost_breakdown_type_check" CHECK ("job_cost_breakdown"."breakdown_type" IN ('estimate', 'actual'))
);
--> statement-breakpoint
CREATE TABLE "work_request_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"candidate_user_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"dispatched_at" timestamp DEFAULT now() NOT NULL,
	"timeout_at" timestamp NOT NULL,
	"responded_at" timestamp,
	"response" text,
	"decline_reason" text,
	CONSTRAINT "work_request_attempt_response_check" CHECK ("work_request_attempt"."response" IN ('accepted', 'declined', 'timeout') OR "work_request_attempt"."response" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid,
	"insurer_file_number" text,
	"property_postal_code" text,
	"property_type" text,
	"property_address" text,
	"site_contact_name" text,
	"site_contact_phone" text,
	"urgency" text,
	"peril_type" text,
	"damage_description" text,
	"coordinates" geography(Point,4326),
	"damage_types" text[],
	"response_window_hours" integer,
	"prior_claims_at_address" integer,
	"repeat_property" boolean DEFAULT false NOT NULL,
	"estimated_loss_amount" numeric,
	"deductible" numeric,
	"adjuster_assigned_at" timestamp,
	"closed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "professional_profile" ADD CONSTRAINT "professional_profile_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_capability" ADD CONSTRAINT "dispatch_capability_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_requester_user_id_user_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_notes" ADD CONSTRAINT "job_notes_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_attachment" ADD CONSTRAINT "job_attachment_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_attachment" ADD CONSTRAINT "job_attachment_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_cost_breakdown" ADD CONSTRAINT "job_cost_breakdown_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_request_attempt" ADD CONSTRAINT "work_request_attempt_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_request_attempt" ADD CONSTRAINT "work_request_attempt_candidate_user_id_user_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_building_id_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."building"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "compliance_record_membership_id_idx" ON "compliance_record" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "compliance_record_expiry_due_idx" ON "compliance_record" USING btree ("expiry_date") WHERE "compliance_record"."expiry_date" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "job_requester_user_id_idx" ON "job" USING btree ("requester_user_id");--> statement-breakpoint
CREATE INDEX "job_assignee_user_id_idx" ON "job" USING btree ("assignee_user_id");--> statement-breakpoint
CREATE INDEX "job_subject_idx" ON "job" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "job_active_status_idx" ON "job" USING btree ("status") WHERE "job"."status" IN ('pending', 'dispatched', 'accepted', 'in_progress');--> statement-breakpoint
CREATE INDEX "job_attachment_job_id_idx" ON "job_attachment" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "work_request_attempt_job_id_idx" ON "work_request_attempt" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "work_request_attempt_candidate_user_id_idx" ON "work_request_attempt" USING btree ("candidate_user_id");--> statement-breakpoint
CREATE INDEX "work_request_attempt_unresponded_idx" ON "work_request_attempt" USING btree ("timeout_at") WHERE "work_request_attempt"."responded_at" IS NULL;--> statement-breakpoint
CREATE INDEX "claim_building_id_idx" ON "claim" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "claim_insurer_file_number_idx" ON "claim" USING btree ("insurer_file_number");--> statement-breakpoint
CREATE INDEX "claim_coordinates_gist_idx" ON "claim" USING gist ("coordinates");