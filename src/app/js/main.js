import { Client } from "../../lib/client.js";
import * as binForage from "https://debutter.dev/x/js/binforage.js";
import { updateRoomTabs } from "./ui.js";
import { appendMessage } from "./room.js";
import { updateMemberJoin, updateMemberLeave } from "./room-info.js";

export const client = new Client();

let token = await binForage.get("token");
let keyPair = await binForage.get("keyPair");

await client
	.login(token, keyPair?.publicKey, keyPair?.privateKey)
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
	updateMemberLeave(userId, roomName, timestamp);
});

client.on("roomMemberJoin", (userId, roomName, timestamp) => {
	console.log("yippee member joined", userId, roomName, timestamp);
	updateMemberJoin(userId, roomName, timestamp);
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
