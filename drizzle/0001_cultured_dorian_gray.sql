CREATE TABLE "generation_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"prompt" text,
	"negative_prompt" text,
	"person_image_url" varchar(500),
	"clothing_image_url" varchar(500),
	"result_image_url" varchar(500),
	"category" "clothing_category",
	"output_quality" varchar(20),
	"generation_ms" integer,
	"status" varchar(20) NOT NULL,
	"error_code" varchar(50),
	"error_message" varchar(500),
	"credits_consumed" integer DEFAULT 0 NOT NULL,
	"request_id" varchar(100),
	"seed" integer,
	"size" varchar(20),
	"watermarked" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generation_records" ADD CONSTRAINT "generation_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generation_records_user_id_created_at_idx" ON "generation_records" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "generation_records_status_idx" ON "generation_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "generation_records_request_id_idx" ON "generation_records" USING btree ("request_id");