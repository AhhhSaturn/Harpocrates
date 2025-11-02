import { log, text, confirm } from "@clack/prompts";
import { treaty } from "@elysiajs/eden";
import type { API } from "@harpocrates/server/src";
import { secrets } from "bun";

export const getServerAddress = async () => {
	const serverAddress = await secrets.get({
		service: "harpocrates",
		name: "serverAddress",
	});

	if (serverAddress) return serverAddress;

	const potentialServerAddress = (await text({
		message: "Server Address",
		placeholder: "include http:// | https://",
		validate: (value) => {
			if (!/^https?:\/\//.test(value)) return "Must start with http(s)://";
		},
	})) as string;

	const api = treaty<API>(potentialServerAddress);

	await api.health.get().catch(() => {
		log.error("Failed to connect to server. Try again.");
		process.exit(1);
	});

	secrets.set({
		service: "harpocrates",
		name: "serverAddress",
		value: potentialServerAddress,
	});
	return potentialServerAddress;
};

export const resetServerAddress = async () => {
	const reset = await confirm({
		message: "Are you sure? This is will reset you Harp server address.",
		initialValue: false,
	});

	// clack can return a symbol if canceled that will be truthy, must compare to bool
	if (reset === true) {
		await secrets.delete({
			service: "harpocrates",
			name: "serverAddress",
		});
		log.success("Reset Server Address");
		return true;
	} else {
		log.info("No changes made.");
		return false;
	}
};
