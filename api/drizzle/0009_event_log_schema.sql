CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"actor_user_id" text,
	"actor_role" text,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"payload" jsonb,
	"urgency" text DEFAULT 'normal' NOT NULL,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_subject_type_check" CHECK ("event"."subject_type" IN ('building', 'claim', 'job')),
	CONSTRAINT "event_urgency_check" CHECK ("event"."urgency" IN ('normal', 'high')),
	CONSTRAINT "event_delivery_status_check" CHECK ("event"."delivery_status" IN ('pending', 'processing', 'delivered'))
);
--> statement-breakpoint
CREATE TABLE "event_recipient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"recipient_user_id" text NOT NULL,
	"recipient_role" text,
	"reason" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_recipient" ADD CONSTRAINT "event_recipient_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_recipient" ADD CONSTRAINT "event_recipient_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_created_at_idx" ON "event" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "event_subject_idx" ON "event" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "event_undelivered_idx" ON "event" USING btree ("delivery_status") WHERE "event"."delivery_status" != 'delivered';--> statement-breakpoint
CREATE INDEX "event_recipient_recipient_created_idx" ON "event_recipient" USING btree ("recipient_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "event_recipient_event_id_idx" ON "event_recipient" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_recipient_unread_idx" ON "event_recipient" USING btree ("read_at") WHERE "event_recipient"."read_at" IS NULL;