import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scrypt,
} from "node:crypto";
import { promisify } from "node:util";
import { getAuth } from "./auth";

export const encrypt = async (data: string) => {
	const auth = await getAuth();
	const key = (await promisify(scrypt)(auth.password, "salt", 32)) as Buffer;
	const iv = randomBytes(16);
	const cipher = createCipheriv("aes-256-ctr", key, iv);
	const encryptedText = Buffer.concat([cipher.update(data), cipher.final()]);
	return Buffer.concat([iv, encryptedText]).toString("hex");
};

export const decrypt = async (encryptedData: string) => {
	const auth = await getAuth();
	const key = (await promisify(scrypt)(auth.password, "salt", 32)) as Buffer;
	const data = Buffer.from(encryptedData, "hex");
	const iv = data.subarray(0, 16);
	const encrypted = data.subarray(16);
	const decipher = createDecipheriv("aes-256-ctr", key, iv);
	const decryptedText = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]);
	return decryptedText.toString("utf-8");
};
