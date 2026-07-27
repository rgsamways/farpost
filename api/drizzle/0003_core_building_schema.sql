CREATE TABLE "role_type" (
	"key" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"tier" text,
	"status" text,
	"privacy_default" text,
	"reputation_eligible" boolean DEFAULT false NOT NULL,
	"default_subscriptions" text[],
	"copy_template_ref" text,
	"hub_config" text,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"promoted_at" timestamp,
	"curator_id" text
);
--> statement-breakpoint
CREATE TABLE "property" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"external_ids" jsonb,
	"civic_number" text,
	"address" text,
	"boundary" geography(Polygon,4326),
	"centroid" geography(Point,4326),
	"dimensions" jsonb,
	"zoning_code" text,
	"zoning_description" text,
	"historical_designation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "building" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"nfc_tag_id" text,
	"address" text,
	"postal_code" text,
	"postal_prefix" text,
	"location" geography(Point,4326),
	"building_type" text,
	"acquisition_channel" text,
	"status" text,
	"activated_at" timestamp,
	"activation_count" integer DEFAULT 0 NOT NULL,
	"neighbourhood_notes" text,
	"roof_type" text,
	"roof_installed_year" integer,
	"foundation_type" text,
	"foundation_updated_year" integer,
	"electrical_type" text,
	"electrical_updated_year" integer,
	"plumbing_type" text,
	"plumbing_updated_year" integer,
	"heating_type" text,
	"heating_installed_year" integer,
	"year_built" integer,
	"owner_controls" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "building_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "unit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"nfc_tag_id" text,
	"unit_label" text NOT NULL,
	"unit_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"asset_id" text,
	"asset_type" text,
	"label" text,
	"manufacturer" text,
	"model" text,
	"serial_number" text,
	"warranty_expiry_date" date,
	"installed_date" date,
	"condition_status" text,
	"photo_urls" text[],
	"condition_notes" text[],
	"compliance" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_subject_type_check" CHECK ("asset"."subject_type" IN ('property', 'building', 'unit'))
);
--> statement-breakpoint
CREATE TABLE "stake" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"role" text NOT NULL,
	"kind" text,
	"status" text NOT NULL,
	"weight" numeric,
	"verification_method" text,
	"contact_snapshot" jsonb,
	"verified_at" timestamp,
	"renewal_date" date,
	"renewal_reminder_sent_at" timestamp,
	"established_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	CONSTRAINT "stake_subject_type_check" CHECK ("stake"."subject_type" IN ('property', 'building', 'unit', 'asset')),
	CONSTRAINT "stake_status_check" CHECK ("stake"."status" IN ('pending', 'active', 'historical', 'pending_verification', 'unclaimed', 'disputed')),
	CONSTRAINT "stake_verification_method_check" CHECK ("stake"."verification_method" IN ('self_asserted', 'admin_reviewed', 'external_id_matched') OR "stake"."verification_method" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "role_type" ADD CONSTRAINT "role_type_curator_id_user_id_fk" FOREIGN KEY ("curator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building" ADD CONSTRAINT "building_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit" ADD CONSTRAINT "unit_building_id_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."building"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stake" ADD CONSTRAINT "stake_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "property_boundary_gist_idx" ON "property" USING gist ("boundary");--> statement-breakpoint
CREATE INDEX "property_centroid_gist_idx" ON "property" USING gist ("centroid");--> statement-breakpoint
CREATE INDEX "property_external_ids_gin_idx" ON "property" USING gin ("external_ids");--> statement-breakpoint
CREATE INDEX "building_property_id_idx" ON "building" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "building_nfc_tag_id_idx" ON "building" USING btree ("nfc_tag_id") WHERE "building"."nfc_tag_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "building_location_gist_idx" ON "building" USING gist ("location");--> statement-breakpoint
CREATE INDEX "building_postal_prefix_idx" ON "building" USING btree ("postal_prefix");--> statement-breakpoint
CREATE INDEX "unit_building_id_idx" ON "unit" USING btree ("building_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_nfc_tag_id_idx" ON "unit" USING btree ("nfc_tag_id") WHERE "unit"."nfc_tag_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "asset_subject_idx" ON "asset" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "stake_subject_status_idx" ON "stake" USING btree ("subject_type","subject_id","status");--> statement-breakpoint
CREATE INDEX "stake_user_status_idx" ON "stake" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "stake_renewal_due_idx" ON "stake" USING btree ("renewal_date") WHERE "stake"."renewal_reminder_sent_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_user_id_role_active_idx" ON "membership" USING btree ("user_id","role") WHERE "membership"."status" = 'active';--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_status_check" CHECK ("membership"."status" IN ('pending', 'active', 'suspended', 'revoked'));