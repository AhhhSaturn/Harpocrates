CREATE TABLE "keys" (
	"project_id" serial NOT NULL,
	"name" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"owned_by" text NOT NULL,
	CONSTRAINT "keys_name_unique" UNIQUE("name"),
	CONSTRAINT "keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_name" text NOT NULL,
	"owned_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_id_unique" UNIQUE("id"),
	CONSTRAINT "projects_project_name_unique" UNIQUE("project_name")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"name" text PRIMARY KEY NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "user_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "keys" ADD CONSTRAINT "keys_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keys" ADD CONSTRAINT "keys_owned_by_user_name_fk" FOREIGN KEY ("owned_by") REFERENCES "public"."user"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owned_by_user_name_fk" FOREIGN KEY ("owned_by") REFERENCES "public"."user"("name") ON DELETE cascade ON UPDATE no action;