CREATE TABLE "checklist_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"asset_types" text[],
	"curator_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_template_name_version_unique" UNIQUE("name","version"),
	CONSTRAINT "checklist_template_status_check" CHECK ("checklist_template"."status" IN ('draft', 'active', 'deprecated'))
);
--> statement-breakpoint
CREATE TABLE "checklist_template_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_template_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"category" text,
	"title" text NOT NULL,
	"description" text,
	"expected_asset_types" text[],
	"recommended_action_on_fail" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"checklist_template_id" uuid NOT NULL,
	"checklist_template_version" integer NOT NULL,
	"completed_at" timestamp,
	"overall_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_run_overall_status_check" CHECK ("checklist_run"."overall_status" IN ('in_progress', 'clean', 'issues_found') OR "checklist_run"."overall_status" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "checklist_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_run_id" uuid NOT NULL,
	"checklist_template_item_id" uuid NOT NULL,
	"asset_id" uuid,
	"condition_status" text NOT NULL,
	"recommended_action" text,
	"notes" text,
	CONSTRAINT "checklist_result_condition_status_check" CHECK ("checklist_result"."condition_status" IN ('inspected_acceptable', 'not_inspected', 'not_present', 'safety_concern', 'repair_needed', 'defect_follow_up'))
);
--> statement-breakpoint
ALTER TABLE "checklist_template" ADD CONSTRAINT "checklist_template_curator_id_user_id_fk" FOREIGN KEY ("curator_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_template_item" ADD CONSTRAINT "checklist_template_item_checklist_template_id_checklist_template_id_fk" FOREIGN KEY ("checklist_template_id") REFERENCES "public"."checklist_template"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_run" ADD CONSTRAINT "checklist_run_building_id_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."building"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_run" ADD CONSTRAINT "checklist_run_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_run" ADD CONSTRAINT "checklist_run_checklist_template_id_checklist_template_id_fk" FOREIGN KEY ("checklist_template_id") REFERENCES "public"."checklist_template"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_result" ADD CONSTRAINT "checklist_result_checklist_run_id_checklist_run_id_fk" FOREIGN KEY ("checklist_run_id") REFERENCES "public"."checklist_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_result" ADD CONSTRAINT "checklist_result_checklist_template_item_id_checklist_template_item_id_fk" FOREIGN KEY ("checklist_template_item_id") REFERENCES "public"."checklist_template_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_result" ADD CONSTRAINT "checklist_result_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checklist_template_item_template_id_idx" ON "checklist_template_item" USING btree ("checklist_template_id");--> statement-breakpoint
CREATE INDEX "checklist_run_building_id_idx" ON "checklist_run" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "checklist_run_membership_id_idx" ON "checklist_run" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "checklist_run_checklist_template_id_idx" ON "checklist_run" USING btree ("checklist_template_id");--> statement-breakpoint
CREATE INDEX "checklist_result_checklist_run_id_idx" ON "checklist_result" USING btree ("checklist_run_id");--> statement-breakpoint
CREATE INDEX "checklist_result_asset_id_idx" ON "checklist_result" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "checklist_result_checklist_template_item_id_idx" ON "checklist_result" USING btree ("checklist_template_item_id");