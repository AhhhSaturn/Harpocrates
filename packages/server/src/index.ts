import { styleText } from "node:util";
import { password } from "bun";
import { and, type DrizzleError, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";
import { Elysia, t } from "elysia";
import { tables } from "./db/schema";

const db = drizzle(process.env.DATABASE_URL);

const api = new Elysia()
	.get("/health", 200)
	.post(
		"/user",
		async ({ body: { authorization, username } }) => {
			const hashedPassword = await password.hash(authorization);
			const data = db
				.insert(tables.users)
				.values({
					name: username,
					password: hashedPassword,
				})
				.execute();
			data.catch((err) => console.log(err));
		},
		{
			body: t.Object({
				username: t.String(),
				authorization: t.String(),
			}),
		},
	)
	.guard(
		{
			async beforeHandle({ status, headers }) {
				const user = await db
					.select({
						username: tables.users.name,
						password: tables.users.password,
					})
					.from(tables.users)
					.where(eq(tables.users.name, headers.username))
					.execute();

				if (
					!user[0] ||
					!(await password.verify(headers.authorization, user[0].password))
				) {
					return status("Forbidden");
				}
			},
			headers: t.Object({
				username: t.String(),
				authorization: t.String(),
			}),
		},
		(guarded) =>
			guarded
				.get("/projects", async ({ headers, set }) => {
					const projects = db
						.select({
							projectName: tables.projects.projectName,
							createdAt: tables.projects.createdAt,
							id: tables.projects.id,
						})
						.from(tables.projects)
						.where(eq(tables.projects.ownedBy, headers.username))
						.orderBy(desc(tables.projects.createdAt))
						.execute();
					projects.catch((err: DrizzleError) => {
						console.error(err);
						set.status = 500;
					});
					return await projects;
				})
				.get(
					"/projects/:projectId",
					async ({ headers, params: { projectId } }) => {
						const project = await db
							.select({
								id: tables.projects.id,
								projectName: tables.projects.projectName,
								createdAt: tables.projects.createdAt,
							})
							.from(tables.projects)
							.where(
								and(
									eq(tables.projects.ownedBy, headers.username),
									eq(tables.projects.id, parseInt(projectId, 10)),
								),
							)
							.execute();
						return {
							auth: headers.username,
							project: project.at(0),
						};
					},
					{
						params: t.Object({
							projectId: t.String(),
						}),
					},
				)
				.get(
					"/projects/:projectId/keys",
					async ({ headers, params: { projectId } }) => {
						const keys = db
							.select({
								name: tables.keys.name,
								key: tables.keys.key,
							})
							.from(tables.keys)
							.where(
								and(
									eq(tables.keys.ownedBy, headers.username),
									eq(tables.keys.projectId, parseInt(projectId, 10)),
								),
							)
							.execute();
						keys.catch((err: DrizzleError) => console.error(err));
						return await keys;
					},
				)
				.put(
					"/projects/:projectId/key",
					async ({ headers, params: { projectId }, body }) => {
						const data = db
							.insert(tables.keys)
							.values({
								projectId: parseInt(projectId, 10),
								name: body.name,
								key: body.key,
								ownedBy: headers.username,
							})
							.execute();
						data.catch((err) => console.log(err));
					},
					{
						body: t.Object({
							name: t.String(),
							key: t.String(),
						}),
					},
				)
				.delete(
					"/projects/:projectId/key",
					async ({ headers, params: { projectId }, body }) => {
						const data = db
							.delete(tables.keys)
							.where(
								and(
									and(
										eq(tables.keys.name, body.name),
										eq(tables.keys.projectId, parseInt(projectId, 10)),
									),
									eq(tables.keys.ownedBy, headers.username),
								),
							)
							.execute();
						data.catch((err) => console.log(err));
					},
					{
						body: t.Object({
							name: t.String(),
						}),
					},
				)
				.put(
					"/projects/create/:projectName",
					async ({ headers, params: { projectName } }) => {
						const data = db
							.insert(tables.projects)
							.values({
								projectName,
								ownedBy: headers.username,
							})
							.execute();
						data.catch((err) => console.log(err));
					},
				)
				.delete(
					"/projects/:projectId",
					async ({ headers, params: { projectId } }) => {
						const data = db
							.delete(tables.projects)
							.where(
								and(
									eq(tables.projects.id, parseInt(projectId, 10)),
									eq(tables.projects.ownedBy, headers.username),
								),
							)
							.execute();
						data.catch((err) => console.log(err));
					},
				),
	);

api.listen(3000, (server) => {
	console.log(
		"🦊",
		styleText(["bold", "magentaBright"], "@harpocrates/server"),
		"running on",
		styleText(["bold", "blue", "underline"], server.url.href),
	);
});

export type API = typeof api;
