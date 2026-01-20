import axios from "axios";
import { locateHomeserver } from "./client.ts";
import { isHomeserver, type Homeserver } from "./types.ts";
// import * as tbForage from "./tbForage.ts";

export async function locateOauth(domain: string): Promise<{
	redirectUrl: string;
	verifier: string;
	state: string;
	homeserver: Homeserver;
} | null> {
	// Locate the homeserver
	const homeserver = await locateHomeserver(domain);

	if (homeserver === null) return null;

	// Generate the oauth values
	const { state, verifier, challenge } = await generateCode();

	// Generate the redirect URL
	const params = new URLSearchParams({
		callback: `${location.origin}${location.pathname}`,
		state: state,
		challenge: challenge,
	});
	const redirectUrl = `${homeserver.baseUrl.http}/auth/login/?${params}`;

	return {
		redirectUrl,
		verifier,
		state,
		homeserver,
	};
}

export async function access(
	homeserver: Homeserver,
	storedValues: {
		verifier: string;
		state: string;
	},
	receivedValues: {
		code: string;
		state: string;
	},
): Promise<{ token: string } | null> {
	const { verifier, state: storedState } = storedValues;
	const { code, state: receivedState } = receivedValues;

	if (!isHomeserver(homeserver)) {
		// Invalid homeserver
		return null;
	}

	// Check if the state matches
	if (storedState !== receivedState) {
		// Invalid state
		return null;
	}

	// Retrieve the access token
	return axios
		.post(`${homeserver.baseUrl.http}/auth/token`, {
			verifier: verifier,
			code: code,
		})
		.then(async (res) => {
			const { token } = res.data as { token: string };

			return { token };
		})
		.catch((err) => {
			console.warn(err);
			return null;
		});
}

export async function whoAmI(
	homeserver: Homeserver,
	token: string,
): Promise<{ username: string } | null> {
	return axios({
		method: "GET",
		url: `${homeserver.baseUrl.http}/me/info`,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
		.then(async (res) => {
			const {
				you: { username },
			} = res.data as {
				you: {
					username: string;
				};
			};

			return { username };
		})
		.catch((err) => {
			console.warn(err);
			return null;
		});
}

/** @returns The array of bytes converted to base64url */
function encodeBase64Url(arr: Uint8Array) {
	// Convert the array to a string
	let str = "";
	for (const val of arr) {
		str += String.fromCharCode(val);
	}

	// Convert the string to base64url
	return window.btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** @returns A random base64url encoded string */
function randomBase64UrlString() {
	const bytes = new Uint8Array(32);
	window.crypto.getRandomValues(bytes);
	return encodeBase64Url(bytes);
}

async function generateCode() {
	// Generate the state
	const state = randomBase64UrlString();

	// Generate the code verifier
	const bytes = new Uint8Array(32);
	window.crypto.getRandomValues(bytes);
	const verifier = encodeBase64Url(bytes);

	// Generate the code challenge
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const hash = await crypto.subtle.digest("SHA-256", data);
	const challenge = encodeBase64Url(new Uint8Array(hash));

	// Return the codes
	return { state, verifier, challenge };
}
