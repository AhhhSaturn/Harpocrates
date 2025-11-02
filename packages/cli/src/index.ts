import { intro } from "@clack/prompts";
import { menu } from "./lib/menus/menu";
import { getServerAddress } from "./lib/serverAddress";

const serverAddress = await getServerAddress();

intro(`Using ${serverAddress.replace("http://", "").replace("http://", "")}`);

menu();
