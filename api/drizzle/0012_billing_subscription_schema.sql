CREATE TABLE "billing_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"interval" text NOT NULL,
	"price_cents" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"period_number" integer DEFAULT 1 NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"period_charged_cents" integer NOT NULL,
	"canceled_at" timestamp,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscription_interval_check" CHECK ("billing_subscription"."interval" IN ('monthly', 'annual')),
	CONSTRAINT "billing_subscription_status_check" CHECK ("billing_subscription"."status" IN ('active', 'canceled', 'past_due'))
);
--> statement-breakpoint
ALTER TABLE "billing_subscription" ADD CONSTRAINT "billing_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscription_user_id_active_idx" ON "billing_subscription" USING btree ("user_id") WHERE "billing_subscription"."status" = 'active';