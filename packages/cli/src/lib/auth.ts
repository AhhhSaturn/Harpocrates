import { randomBytes } from "node:crypto";
import { confirm, group, log, password, text } from "@clack/prompts";
import { treaty } from "@elysiajs/eden";
import type { API } from "@harpocrates/server/src";
import { secrets } from "bun";
import { getServerAddress } from "./serverAddress";

const serverAddress = await getServerAddress();
const api = treaty<API>(serverAddress);

export const setAuth = async () => {
	const pregeneratedIv = randomBytes(16).toHex();
	const auth = await group({
		username: () =>
			text({
				message: "username",
			}),
		password: () =>
			password({
				message: "password",
			}),
		key: () =>
			text({
				message:
					"key | This MUST be identical on all machines. If this is your first time use the pregenerated one.",
				initialValue: pregeneratedIv,
			}),
	});

	await Promise.all([
		secrets.set({
			service: "harpocrates",
			name: "username",
			value: auth.username,
		}),
		secrets.set({
			service: "harpocrates",
			name: "password",
			value: auth.password,
		}),
		secrets.set({
			service: "harpocrates",
			name: "key",
			value: auth.key,
		}),
	]);

	const confirmation = await confirm({
		message: "Do you want to add your user to the database?",
		initialValue: true,
	});

	if (typeof confirmation !== "symbol" && confirmation) {
		await publishUserToDB();
	}

	return auth;
};

export const getAuth = async () => {
	const auth = {
		username: await secrets.get({
			service: "harpocrates",
			name: "username",
		}),
		password: await secrets.get({
			service: "harpocrates",
			name: "password",
		}),
		key: await secrets.get({
			service: "harpocrates",
			name: "key",
		}),
	};
	if (auth.username && auth.password && auth.key)
		return auth as { username: string; password: string; key: string };

	return await setAuth();
};

export const publishUserToDB = async () => {
	const auth = await getAuth();
	const user = api.user.post({
		username: auth.username,
		authorization: auth.password,
	});
	await user;
	user.catch((err) => {
		log.error("An error occurred while creating the user");
		console.error(err);
	});
	user.then(() => {
		log.success("Created User");
	});
};
