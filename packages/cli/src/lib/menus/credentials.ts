import { select } from "@clack/prompts";
import { publishUserToDB, setAuth } from "../auth";
import { getServerAddress, resetServerAddress } from "../serverAddress";

export const credentials = async () => {
	const option = await select({
		message: "Credentials",
		options: [
			{
				value: "serverAddress",
				label: "Server Address",
			},
			{
				value: "auth",
				label: "Authentication",
			},
			{
				value: "publish",
				label: "Publish User To DB",
			},
		],
	});
	await parseOption(option);
};

const parseOption = async (option: symbol | string) => {
	if (typeof option === "symbol") return;
	switch (option) {
		case "serverAddress": {
			if (await resetServerAddress()) {
				await getServerAddress();
			}
			break;
		}
		case "auth": {
			await setAuth();
			break;
		}
		case "publish": {
			await publishUserToDB();
			break;
		}
	}
};
