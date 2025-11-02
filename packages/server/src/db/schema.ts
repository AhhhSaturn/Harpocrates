import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
	name: text("name").notNull().primaryKey().unique(),
	password: text("password").notNull(),
});

export const projects = pgTable("projects", {
	id: serial("id").primaryKey().unique().notNull(),
	projectName: text("project_name").notNull().unique(),
	ownedBy: text("owned_by")
		.notNull()
		.references(() => users.name, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const keys = pgTable("keys", {
	projectId: serial("project_id")
		.references(() => projects.id, { onDelete: "cascade" })
		.notNull(),
	name: text("name").notNull().unique().primaryKey(),
	key: text("key").notNull().unique(),
	ownedBy: text("owned_by")
		.notNull()
		.references(() => users.name, { onDelete: "cascade" }),
});

export const tables = {
	projects,
	keys,
	users,
} as const;

export type Table = typeof tables;
