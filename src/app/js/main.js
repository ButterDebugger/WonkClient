import { Client, generateKeyPair } from "../../lib/client.js";
import * as binForage from "https://debutter.dev/x/js/binforage.js";
import { updateRoomTabs } from "./ui.js";
import { appendMessage } from "./room.js";

let _username = await binForage.get("username");
let token = await binForage.get("token");
let keyPair = await binForage.get("keyPair");
let homeserver = await binForage.get("homeserver");

if (homeserver === null) {
	location.href = "/login/";
}

export const client = new Client(homeserver?.baseUrl);

// Save a random pgp key pair if one doesn't exist
if (!keyPair) {
	keyPair = await generateKeyPair(_username);

	await binForage.set("keyPair", keyPair);
}

await client
	.login(token, keyPair.publicKey, keyPair.privateKey)
	.catch((err) => {
		console.error(err);

		location.href = "/login/";
	});

client.on("ready", async () => {
	console.log(`Logged in as ${client.user.username}!`);

	await joinRoom("wonk");

	updateRoomTabs();
});

client.on("ping", (pings) => {
	console.log("pings", pings);
});

client.on("roomMemberLeave", (userId, roomName, timestamp) => {
	console.log("oopise member left", userId, roomName, timestamp);
});

client.on("roomMemberJoin", (userId, roomName, timestamp) => {
	console.log("yippee member joined", userId, roomName, timestamp);
});

client.on("roomMemberMessage", (message) => {
	console.log("message", message);
	appendMessage(message);
});

export async function joinRoom(roomName) {
	try {
		await client.rooms.join(roomName);
	} catch (error) {
		console.warn(error);
		return false;
	}
	return true;
}

export async function leaveRoom(roomName) {
	try {
		let success = await client.rooms.leave(roomName);
		if (!success) return false;
	} catch (error) {
		console.warn(error);
		return false;
	}

	updateRoomTabs();
	return true;
}

export async function sendMessage(roomName, options) {
	try {
		await client.rooms.cache.get(roomName).send(options);
	} catch (error) {
		console.warn(error);
		return false;
	}
	return true;
}
