CREATE TABLE "fact_staleness" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"category" text NOT NULL,
	"last_documented_at" date NOT NULL,
	"half_life_months" integer NOT NULL,
	"next_stale_at" date GENERATED ALWAYS AS ((last_documented_at + (half_life_months * interval '1 month'))::date) STORED,
	"notified_at" timestamp,
	"source_method" text NOT NULL,
	"source_confidence_level" integer NOT NULL,
	CONSTRAINT "fact_staleness_building_id_category_unique" UNIQUE("building_id","category"),
	CONSTRAINT "fact_staleness_source_method_check" CHECK ("fact_staleness"."source_method" IN ('field_visit', 'professional_audit', 'permit_record', 'form_submission')),
	CONSTRAINT "fact_staleness_source_confidence_level_check" CHECK ("fact_staleness"."source_confidence_level" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "contribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"category" text NOT NULL,
	"payload" jsonb NOT NULL,
	"contributor_role" text,
	"confidence_level" integer NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"source_method" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contribution_confidence_level_check" CHECK ("contribution"."confidence_level" BETWEEN 1 AND 5),
	CONSTRAINT "contribution_review_status_check" CHECK ("contribution"."review_status" IN ('pending', 'verified', 'flagged', 'rejected')),
	CONSTRAINT "contribution_source_method_check" CHECK ("contribution"."source_method" IN ('field_visit', 'professional_audit', 'permit_record', 'form_submission'))
);
--> statement-breakpoint
CREATE TABLE "scout_visit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"photo_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes" text,
	"visited_at" timestamp DEFAULT now() NOT NULL,
	"gps_accuracy_m" numeric
);
--> statement-breakpoint
ALTER TABLE "fact_staleness" ADD CONSTRAINT "fact_staleness_building_id_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."building"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_building_id_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."building"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_visit" ADD CONSTRAINT "scout_visit_building_id_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."building"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_visit" ADD CONSTRAINT "scout_visit_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fact_staleness_building_id_idx" ON "fact_staleness" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "fact_staleness_unnotified_idx" ON "fact_staleness" USING btree ("next_stale_at") WHERE "fact_staleness"."notified_at" IS NULL;--> statement-breakpoint
CREATE INDEX "contribution_building_id_idx" ON "contribution" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "contribution_membership_id_idx" ON "contribution" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "scout_visit_building_id_idx" ON "scout_visit" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "scout_visit_membership_id_idx" ON "scout_visit" USING btree ("membership_id");