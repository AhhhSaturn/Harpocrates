import { secrets } from "bun";

Promise.all([
	secrets.delete({
		service: "harpocrates",
		name: "username",
	}),
	secrets.delete({
		service: "harpocrates",
		name: "password",
	}),
	secrets.delete({
		service: "harpocrates",
		name: "key",
	}),
])
	.then(() => {
		console.log("wiped secrets");
	})
	.catch((err) => {
		console.error(err);
	});
