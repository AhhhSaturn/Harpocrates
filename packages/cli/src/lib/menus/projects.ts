import { confirm, log, note, select, text } from "@clack/prompts";
import { treaty } from "@elysiajs/eden";
import type { API } from "@harpocrates/server/src";
import { getAuth } from "../auth";
import { addKey, deleteKeyPicker, generateEnv, getKeys } from "../keys";
import { getServerAddress } from "../serverAddress";

const serverAddress = await getServerAddress();
const auth = await getAuth();
const api = treaty<API>(serverAddress);

export const projects = async () => {
	const parseOption = async (option: symbol | string) => {
		if (typeof option === "symbol") return;
		switch (option) {
			case "list": {
				await listProjects();
				break;
			}
			case "create": {
				await createProject();
				break;
			}
			case "delete": {
				await deleteProject();
				break;
			}
		}
	};

	const option = await select({
		message: "Projects",
		options: [
			{
				value: "list",
				label: "List",
			},
			{
				value: "create",
				label: "Create",
			},
			{
				value: "delete",
				label: "Delete",
			},
		],
	});
	await parseOption(option);
};

export const listProjects = async () => {
	const { data, error } = await api.projects.get({
		headers: {
			authorization: auth.password,
			username: auth.username,
		},
	});
	if (error) {
		log.error(`An error occurred. (${error.status})`);
		console.error(error.value);
		process.exit(1);
	}

	const parsedProjects: { value: string; label: string; hint: string }[] = [];

	for (const project of data) {
		parsedProjects.push({
			label: project.projectName,
			value: project.id.toString(),
			hint: `Created on ${new Date(project.createdAt).toDateString()}`,
		});
	}

	if (parsedProjects.length === 0) {
		log.warn("No projects");
		return;
	}

	const project = await select({
		message: "Projects",
		options: parsedProjects,
		maxItems: 7,
	});
	if (typeof project === "symbol") return;

	await viewProject(project);
};

export const viewProject = async (projectId: string) => {
	const parseOption = async (option: symbol | string) => {
		if (typeof option === "symbol") return;

		switch (option) {
			case "list": {
				const keys = await getKeys(projectId);
				const parsedKeys: string[] = [];

				for (const key of keys) {
					parsedKeys.push(`${key.name}="${key.key}"`);
				}
				note(parsedKeys.join("\n"), "Keys");
				break;
			}
			case "generate": {
				await generateEnv(projectId);
				break;
			}
			case "add": {
				await addKey(projectId);
				break;
			}
			case "delete": {
				await deleteKeyPicker(projectId);
				break;
			}
		}
	};

	const { data } = await api.projects({ projectId }).get({
		headers: {
			authorization: auth.password,
			username: auth.username,
		},
	});

	if (!data || !data.project) {
		log.error("This project doesn't exist");
		return;
	}

	const option = await select({
		message: data.project?.projectName,
		options: [
			{
				value: "generate",
				label: "Generate .env File",
			},
			{
				value: "add",
				label: "Add Key",
			},
			{
				value: "delete",
				label: "Delete Key",
			},
			{
				value: "list",
				label: "List Keys",
			},
		],
	});
	await parseOption(option);
};

export const createProject = async () => {
	const projectName = await text({
		message: "Project Name",
		validate: (value) => {
			if (!/^[a-zA-Z0-9 ]{1,}$/.test(value))
				return "Must be longer than one, alphanumerical (except `-` `_` and spaces)";
		},
	});
	if (typeof projectName === "symbol") return;

	const {
		response: { ok },
		error,
	} = await api.projects.create({ projectName }).put(undefined, {
		headers: { username: auth.username, authorization: auth.password },
	});

	if (ok) {
		log.success("Created Project");
	} else {
		log.error("An error occurred while created the project");
		console.error(error);
	}
};

export const deleteProject = async () => {
	const { data, error } = await api.projects.get({
		headers: {
			authorization: auth.password,
			username: auth.username,
		},
	});
	if (error) {
		log.error(`An error occurred. (${error.status})`);
		console.error(error.value);
		process.exit(1);
	}

	const parsedProjects: { value: string; label: string; hint: string }[] = [];

	for (const project of data) {
		parsedProjects.push({
			label: project.projectName,
			value: project.id.toString(),
			hint: `Created on ${new Date(project.createdAt).toDateString()}`,
		});
	}

	const project = await select({
		message: "Projects",
		options: parsedProjects,
		maxItems: 7,
	});
	if (typeof project === "symbol") return;

	const confirmation = await confirm({
		message: "Are you sure? This action is irreversible.",
		initialValue: false,
	});

	if (typeof confirmation === "symbol" || !confirmation) {
		log.info("Cancelled");
		return;
	}

	api.projects({ projectId: project }).delete(undefined, {
		headers: {
			authorization: auth.password,
			username: auth.username,
		},
	});
};
