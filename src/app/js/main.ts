// @ts-ignore
import * as binForage from "https://debutter.dev/x/js/binforage.js";
import {
	Client,
	generateKeyPair,
	errorCodes,
	ClientError,
} from "../../lib/client.ts";
import type { MessageOptions } from "../../lib/roomManager.ts";
import { appendMessage } from "./views/room.ts";
import { updateRoomsTabs } from "./views/rooms.ts";

const _username = await binForage.get("username");
const token = await binForage.get("token");
let keyPair = await binForage.get("keyPair");
const homeserver = await binForage.get("homeserver");

if (homeserver === null) {
	location.href = "/login/";
}

// Save a random pgp key pair if one doesn't exist
if (!keyPair) {
	keyPair = await generateKeyPair(_username);

	await binForage.set("keyPair", keyPair);
}

// Initialize the client
export const client = (await Client.login(
	token,
	keyPair.publicKey,
	keyPair.privateKey,
	homeserver?.baseUrl,
).catch((err) => {
	console.error(err);

	location.href = "/login/";
})) as Client;

// Add event listeners
client.on("ready", async () => {
	console.log(`Logged in as ${client.user.username}!`);

	await joinRoom("wonk");

	updateRoomsTabs();
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

export async function joinRoom(roomName: string) {
	try {
		await client.rooms.join(roomName);
	} catch (error) {
		console.warn(error);
		return false;
	}
	return true;
}

export async function joinOrCreateRoom(roomName: string): Promise<boolean> {
	try {
		await client.rooms.join(roomName);
	} catch (error) {
		if (error instanceof ClientError) {
			const clientError = error as ClientError;

			if (clientError.code === errorCodes.RoomDoesNotExist) {
				try {
					await client.rooms.create(roomName);
					await client.rooms.join(roomName); // NOTE: I shouldn't need to join a room that I created
					updateRoomsTabs();
				} catch (error) {
					console.warn(error);
					return false;
				}
				return true;
			}
		}

		console.warn(error);
		return false;
	}
	return true;
}

export async function leaveRoom(roomName: string) {
	try {
		const success = await client.rooms.leave(roomName);
		if (!success) return false;
	} catch (error) {
		console.warn(error);
		return false;
	}

	updateRoomsTabs();
	return true;
}

export async function sendMessage(roomName: string, options: MessageOptions) {
	try {
		const room = client.rooms.cache.get(roomName);
		if (!room) return false;

		await room.send(options);
	} catch (error) {
		console.warn(error);
		return false;
	}
	return true;
}
