import { confirm, group, log, select, text } from "@clack/prompts";
import { treaty } from "@elysiajs/eden";
import type { API } from "@harpocrates/server/src";
import { getAuth } from "./auth";
import { decrypt, encrypt } from "./encrypt";
import { getServerAddress } from "./serverAddress";

const serverAddress = await getServerAddress();
const api = treaty<API>(serverAddress);

export const getKeys = async (projectId: string) => {
	const auth = await getAuth();
	const { data, error } = await api.projects({ projectId }).keys.get({
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

	const keys: { name: string; key: string }[] = [];

	for (const key of data) {
		const decryptedKey = await decrypt(key.key as string);
		keys.push({ name: key.name, key: decryptedKey });
	}

	return keys;
};

export const writeKey = async (
	projectId: string,
	name: string,
	data: string,
) => {
	const auth = await getAuth();
	const key = await encrypt(data);
	await api.projects({ projectId }).key.put(
		{
			name,
			key,
		},
		{
			headers: {
				authorization: auth.password,
				username: auth.username,
			},
		},
	);
};

export const deleteKey = async (projectId: string, name: string) => {
	const auth = await getAuth();
	await api.projects({ projectId }).key.delete(
		{
			name,
		},
		{
			headers: {
				authorization: auth.password,
				username: auth.username,
			},
		},
	);
};

export const generateEnv = async (projectId: string) => {
	const keys = await getKeys(projectId);
	const parsedKeys: string[] = [];

	for (const key of keys) {
		parsedKeys.push(`${key.name}="${key.key}"`);
	}

	const file = Bun.write(".env", parsedKeys.join("\n"));

	file.catch((err) => {
		log.error("An error occurred while writing the .env file");
		console.error(err);
	});
	file.then(() => {
		log.success("Wrote .env file");
	});
};

export const addKey = async (projectId: string) => {
	const { name, key } = await group({
		name: () =>
			text({
				message: "Name",
			}),
		key: () =>
			text({
				message: "Key",
			}),
	});

	if (typeof name === "symbol" || typeof key === "symbol") return;

	const write = writeKey(projectId, name, key);
	await write;
	write.catch((err) => {
		log.error("An error occurred while writing the key");
		console.error(err);
	});
	write.then(() => {
		log.success("Written key");
	});
};

export const deleteKeyPicker = async (projectId: string) => {
	const keys = await getKeys(projectId);
	const parsedKeys: { value: string; label: string }[] = [];

	for (const key of keys) {
		parsedKeys.push({
			label: key.name,
			value: key.name,
		});
	}

	if (parsedKeys.length === 0) {
		log.warn("No Keys");
		return;
	}

	const key = await select({
		message: "Delete Key",
		options: parsedKeys,
		maxItems: 7,
	});
	if (typeof key === "symbol") return;

	const confirmation = await confirm({
		message: "Are you sure? This action is irreversible.",
		initialValue: false,
	});

	if (typeof confirmation === "symbol" || !confirmation) {
		log.info("Cancelled");
		return;
	}

	await deleteKey(projectId, key);
	log.success(`Deleted ${key}`);
};
