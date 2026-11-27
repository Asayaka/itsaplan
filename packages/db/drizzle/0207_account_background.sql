ALTER TABLE "user_preference" ADD COLUMN "background_image" text;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "background_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "background_opacity" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_background_opacity_check" CHECK ("user_preference"."background_opacity" BETWEEN 0 AND 40);