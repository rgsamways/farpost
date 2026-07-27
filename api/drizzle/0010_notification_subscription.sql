CREATE TABLE "notification_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"anchor_type" text NOT NULL,
	"anchor_value" text,
	"channels" text[] DEFAULT '{}'::text[] NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"frequency_preference" text DEFAULT 'immediate' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_subscription_anchor_type_check" CHECK ("notification_subscription"."anchor_type" IN ('building', 'postal_code', 'all')),
	CONSTRAINT "notification_subscription_frequency_preference_check" CHECK ("notification_subscription"."frequency_preference" IN ('immediate', 'daily_digest', 'weekly_digest', 'never'))
);
--> statement-breakpoint
ALTER TABLE "notification_subscription" ADD CONSTRAINT "notification_subscription_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_subscription_membership_id_idx" ON "notification_subscription" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "notification_subscription_fanout_idx" ON "notification_subscription" USING btree ("event_type","anchor_type","anchor_value") WHERE "notification_subscription"."active" = true;