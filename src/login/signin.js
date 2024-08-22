import tippy from "tippy.js";
import axios from "axios";
import { locateHomeserver } from "../lib/client.js";
import * as binForage from "https://debutter.dev/x/js/binforage.js";

const errorMessageEle = document.getElementById("error-message");
const homeserverEle = document.getElementById("homeserver");
const homeserverLabelEle = document.querySelector("label[for=homeserver]");
const authBtn = document.getElementById("auth-btn");
const continueBtn = document.getElementById("continue-btn");
const logoutBtn = document.getElementById("logout-btn");
const accessStage = document.getElementById("access-stage");
const loginStage = document.getElementById("login-stage");
const continueStage = document.getElementById("continue-stage");
const usernameEle = document.getElementById("username");

let ogAuthBtnText = authBtn.innerText;
let params = new URLSearchParams(location.search);

tippy([homeserverEle, homeserverLabelEle], {
	content:
		'<p style="text-align: center; margin: 0px;">The server you will be connected to<br>(also where your data will be stored)</p>',
	allowHTML: true,
	delay: [500, 0]
});

/** @returns The array of bytes converted to base64url */
function encodeBase64Url(arr) {
	return window
		.btoa(arr.reduce((str, val) => (str += String.fromCharCode(val)), ""))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

/** @returns A random base64url encoded string */
function randomBase64UrlString() {
	let bytes = new Uint8Array(32);
	window.crypto.getRandomValues(bytes);
	return encodeBase64Url(bytes);
}

async function generateCode() {
	// Generate the state
	let state = randomBase64UrlString();

	// Generate the code verifier
	let bytes = new Uint8Array(32);
	window.crypto.getRandomValues(bytes);
	let verifier = encodeBase64Url(bytes);

	// Generate the code challenge
	let encoder = new TextEncoder();
	let data = encoder.encode(verifier);
	let hash = await crypto.subtle.digest("SHA-256", data);
	let challenge = encodeBase64Url(new Uint8Array(hash));

	// Return the codes
	return { state, verifier, challenge };
}

if ((await binForage.get("token")) !== null) {
	continueStage.classList.remove("hidden");

	whoAmI();
} else if (params.has("state")) {
	accessStage.classList.remove("hidden");

	access();
} else {
	loginStage.classList.remove("hidden");
}

authBtn.addEventListener("click", async () => {
	if (!homeserverEle.validity.valid) return;

	let domain = homeserverEle.value;

	errorMessageEle.innerText = "";
	authBtn.innerText = "Locating";
	authBtn.disabled = true;
	homeserverEle.disabled = true;

	let homeserver = await locateHomeserver(domain);

	if (homeserver === null) {
		errorMessageEle.innerText = "Invalid homeserver";
		authBtn.innerText = ogAuthBtnText;
		authBtn.disabled = false;
		homeserverEle.disabled = false;
		return;
	}

	authBtn.innerText = "Redirecting";
	let { state, verifier, challenge } = await generateCode();
	await binForage.set("verifier", verifier);
	await binForage.set("state", state);
	await binForage.set("homeserver", homeserver);

	let params = new URLSearchParams({
		callback: encodeURIComponent(`${location.origin}${location.pathname}`),
		state: state,
		challenge: challenge
	});

	location.href = `${homeserver.baseUrl.http}/oauth/login/?${params}`;
});

continueBtn.addEventListener("click", () => {
	location.href = "/app/";
});

logoutBtn.addEventListener("click", async () => {
	await binForage.remove("token");

	loginStage.classList.remove("hidden");
	continueStage.classList.add("hidden");
});

async function access() {
	let verifier = await binForage.get("verifier");
	let homeserver = await binForage.get("homeserver");

	// Check if the state matches
	if (params.get("state") !== (await binForage.get("state"))) {
		errorMessageEle.innerText = "Invalid state";
		accessStage.classList.add("hidden");
		loginStage.classList.remove("hidden");
		return;
	}

	// Retrieve the access token
	axios
		.post(`${homeserver.baseUrl.http}/oauth/token/`, {
			verifier: verifier
		})
		.then(async (res) => {
			let { token } = res.data;

			// Store the token
			await binForage.set("token", token);

			// Remove query string from url and in the process go to the continue stage
			location.href = `${location.origin}${location.pathname}`;
		})
		.catch((err) => {
			errorMessageEle.innerText = "Failed to retrieve access token";
			accessStage.classList.add("hidden");
			loginStage.classList.remove("hidden");
		});
}

async function whoAmI() {
	let token = await binForage.get("token");
	let homeserver = await binForage.get("homeserver");

	axios({
		method: "GET",
		url: `${homeserver.baseUrl.http}/sync/client/`,
		headers: {
			Authorization: `Bearer ${token}`
		}
	})
		.then(async (res) => {
			let {
				you: { username }
			} = res.data;

			await binForage.set("username", username);

			usernameEle.innerText = `@${username}:${homeserver.namespace}`;
			continueBtn.disabled = false;
		})
		.catch((err) => {});
}
