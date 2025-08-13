export interface BaseUrl {
	http: string;
	ws: string;
}
export function isBaseUrl(url: unknown): url is BaseUrl {
	return (
		typeof url === "object" && url !== null && "http" in url && "ws" in url
	);
}

export interface Homeserver {
	namespace: string;
	baseUrl: BaseUrl;
}
export function isHomeserver(server: unknown): server is Homeserver {
	return (
		typeof server === "object" &&
		server !== null &&
		"namespace" in server &&
		"baseUrl" in server &&
		isBaseUrl(server.baseUrl)
	);
}
