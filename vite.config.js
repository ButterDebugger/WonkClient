import { basename, dirname, resolve } from "node:path";
import { glob } from "glob";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const alwaysFullReload = {
	name: "always-full-reload",
	handleHotUpdate({ server }) {
		server.ws.send({ type: "full-reload" });
		return [];
	},
};

export default defineConfig({
	server: {
		port: process.env.PORT ?? 4030,
	},
	build: {
		target: "es2022",
		outDir: resolve(process.cwd(), "dist"),
		rollupOptions: {
			input: (await glob("src/**/index.html")).reduce(
				(put, path) => ({
					...put,
					[basename(dirname(path))]: path,
				}),
				{},
			),
		},
		sourcemap: true,
	},
	resolve: {
		alias: {
			"@fa": resolve(__dirname, "./node_modules/@fortawesome/fontawesome-free"),
		},
	},
	publicDir: resolve(process.cwd(), "public"),
	root: resolve(process.cwd(), "src"),
	appType: "mpa",
	plugins: [
		alwaysFullReload,
		VitePWA({
			registerType: "autoUpdate",
			manifestFilename: "manifest.json",
			workbox: {
				navigateFallbackDenylist: [/^\/login/],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "google-fonts",
							expiration: {
								maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
							},
						},
					},
					{
						urlPattern:
							/^https:\/\/(?:cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|debutter\.dev\/x|unpkg\.com)\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "third-party-libraries",
							expiration: {
								maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
							},
						},
					},
					{
						urlPattern: /(?:.*?)\.(?:ico|svg|png|jpe?g|gif)$/i,
						handler: "CacheFirst",
						options: {
							cacheName: "asset-cache",
							expiration: {
								maxAgeSeconds: 24 * 60 * 60, // 24 hours
							},
						},
					},
					{
						urlPattern: /(?:.*?)\.(?:html|htm|js|ts|css|scss)$/i,
						handler: "NetworkFirst",
						options: {
							cacheName: "source-cache",
						},
					},
				],
			},
			manifest: {
				name: "Wonk Chat",
				short_name: "Wonk Chat",
				start_url: "/app/",
				orientation: "portrait",
				theme_color: "#5841f7",
				background_color: "#000000",
				icons: [
					{
						src: "app-icon-192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "app-icon-192-maskable.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "maskable",
					},
					{
						src: "app-icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "app-icon-512-maskable.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
		}),
	],
});
