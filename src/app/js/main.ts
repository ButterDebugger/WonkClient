// @ts-ignore
import * as tbForage from "../../tbForage.ts";
import {
	Client,
	generateKeyPair,
	errorCodes,
	ClientError,
	Homeserver
} from "../../lib/client.ts";
import type { MessageOptions } from "../../lib/roomManager.ts";
import { appendMessage } from "./views/room.ts";
import { updateRoomsTabs } from "./views/rooms.ts";
import { KeyPair } from "../../lib/cryption.ts";

// NOTE: all of these values can be null but are caught by the /login/ redirect
const _username = <string>await tbForage.get("username");
const token = <string>await tbForage.get("token");
let keyPair = <KeyPair>await tbForage.get("keyPair");
const homeserver = <Homeserver>await tbForage.get("homeserver");

if (
	_username === null ||
	token === null ||
	keyPair === null ||
	homeserver === null
) {
	location.href = "/login/";
}

// Save a random pgp key pair if one doesn't exist
if (!keyPair) {
	keyPair = await generateKeyPair(_username);

	await tbForage.set("keyPair", keyPair);
}

// Initialize the client
export const client = (await Client.login(
	token,
	keyPair.publicKey,
	keyPair.privateKey,
	homeserver?.baseUrl
).catch((err) => {
	console.error(err);

	location.href = "/login/";
})) as Client;

// Add event listeners
client.once("ready", async () => {
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
