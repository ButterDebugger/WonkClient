import { basename, dirname, resolve } from "node:path";
import { glob } from "glob";
import { defineConfig } from "vite";

const alwaysFullReload = {
	name: "always-full-reload",
	handleHotUpdate({ server }) {
		server.ws.send({ type: "full-reload" });
		return [];
	}
};

export default defineConfig({
	server: {
		port: process.env.PORT ?? 4030
	},
	build: {
		target: "es2022",
		outDir: resolve(process.cwd(), "dist"),
		rollupOptions: {
			input: (await glob("src/**/index.html")).reduce(
				(put, path) => ({
					...put,
					[basename(dirname(path))]: path
				}),
				{}
			)
		}
	},
	publicDir: resolve(process.cwd(), "public"),
	root: resolve(process.cwd(), "src"),
	appType: "mpa",
	plugins: [alwaysFullReload]
});
