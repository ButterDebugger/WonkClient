// NOTE: I don't believe this actually is used

self.addEventListener("install", (event) => {
	console.log("Service worker installed");
});
self.addEventListener("activate", (event) => {
	console.log("Service worker activated");
});
