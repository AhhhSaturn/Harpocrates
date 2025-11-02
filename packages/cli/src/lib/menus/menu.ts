import { select } from "@clack/prompts";
import { credentials } from "./credentials";
import { projects } from "./projects";

export const menu = async () => {
	const option = await select({
		message: "Menu",
		options: [
			{
				value: "projects",
				label: "Projects",
			},
			{
				value: "credentials",
				label: "Credentials",
			},
		],
	});
	await parseOption(option);

	menu();
};

const parseOption = async (option: string | symbol) => {
	if (typeof option === "symbol" && option.description === "clack:cancel") {
		process.exit(0);
	}
	switch (option) {
		case "credentials": {
			await credentials();
			break;
		}
		case "projects": {
			await projects();
			break;
		}
	}
};
