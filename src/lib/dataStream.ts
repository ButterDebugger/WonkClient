import { Client, RoomMessage } from "./client.ts";
import { decryptData } from "./cryption.ts";
import * as TruffleByte from "@debutter/trufflebyte";

export class StreamManager {
	#socket: WebSocket | null;

	client: Client;

	constructor(client: Client) {
		this.client = client;
		this.#socket = null;
	}

	connect() {
		if (this.#socket) {
			console.warn("Already connected to event stream");
			return;
		}

		// Connect to event stream
		this.#socket = new WebSocket(`${this.client.baseUrl.ws}/stream`, [
			"Authorization",
			this.client.token,
		]);
		this.#socket.binaryType = "arraybuffer";

		// Add stream event listeners
		this.#socket.addEventListener("open", () => {
			this.client.emit("ready");
		});
		this.#socket.addEventListener("message", async (event) => {
			const data = await parseStreamData(event.data, this.client.privateKey);
			if (data === null) return;

			switch (data.event) {
				case "ping": {
					const pingData = <PingBody>data;

					this.client.emit("ping", pingData.ping);
					break;
				}
				case "roomMemberJoin": {
					const roomMemberJoinData = <RoomMemberJoinBody>data;

					this.client.emit(
						"roomMemberJoin",
						roomMemberJoinData.username,
						roomMemberJoinData.roomId,
						roomMemberJoinData.timestamp,
					);
					break;
				}
				case "roomMemberLeave": {
					const roomMemberLeaveData = <RoomMemberLeaveBody>data;

					this.client.emit(
						"roomMemberLeave",
						roomMemberLeaveData.username,
						roomMemberLeaveData.roomId,
						roomMemberLeaveData.timestamp,
					);
					break;
				}
				case "userUpdate": {
					const updateUserData = <UserUpdateBody>data;

					this.client.emit(
						"userUpdate",
						updateUserData.id,
						updateUserData.data,
						updateUserData.timestamp,
					);
					break;
				}
				case "message": {
					const messageData = <MessageBody>data;

					const authorData = {
						id: messageData.author.id,
						color: messageData.author.color,
						offline: messageData.author.offline,
						username: messageData.author.username,
						timestamp: messageData.timestamp,
					};
					this.client.users.update(messageData.author.username, authorData, Date.now());

					const message = new RoomMessage(
						this.client,
						messageData.author.id,
						messageData.roomId,
						messageData.content,
						messageData.attachments,
						messageData.timestamp,
					);

					this.client.emit("roomMemberMessage", message);
					break;
				}
			}
		});
		this.#socket.addEventListener("close", () => {
			this.client.emit("disconnect");
		});
		this.#socket.addEventListener("error", () => {
			this.client.emit("disconnect");
		});
	}

	disconnect() {
		if (!this.#socket) {
			console.warn("Already disconnected from event stream");
			return;
		}

		this.#socket.close();
		this.#socket = null;
	}

	subscribe(subscriptions: string[]) {
		// TODO: test and implement
		if (!this.#socket) return;

		this.#socket.send(
			TruffleByte.encode({
				event: "listen",
				subscriptions: subscriptions,
			}),
		);
	}
}

/*
 * Stream body types
 */

export interface StreamBody {
	event: "connect" | "message" | "ping" | "roomMemberJoin" | "roomMemberLeave" | "userUpdate";
}
function isStreamBody(body: unknown): body is StreamBody {
	return typeof body === "object" && body !== null && "event" in body;
}

/*
 * Event body types
 */

export interface ConnectBody extends StreamBody {
	event: "connect";
	opened: boolean;
}
export interface PingBody extends StreamBody {
	event: "ping";
	ping: number;
}
export interface RoomMemberJoinBody extends StreamBody {
	event: "roomMemberJoin";
	username: string;
	roomId: string;
	timestamp: number;
}
export interface RoomMemberLeaveBody extends StreamBody {
	event: "roomMemberLeave";
	username: string;
	roomId: string;
	timestamp: number;
}
export interface UserUpdateBody extends StreamBody {
	event: "userUpdate";
	id: string;
	data: UserData;
	timestamp: number;
}
export interface MessageBody extends StreamBody {
	event: "message";
	author: UserData;
	roomId: string;
	content: string;
	attachments: string[];
	timestamp: number;
}

/*
 * Stream data types
 */

export interface UserData {
	id: string;
	username: string;
	color: string;
	offline: boolean;
}

/**
 * Decrypts and parses the stream body
 *
 * @param input The input ArrayBuffer to be decoded and decrypted
 * @param privateKey The private key to decrypt the input with
 *
 * @returns The parsed stream body if successful, otherwise null
 */
export async function parseStreamData<Body extends StreamBody>(
	input: ArrayBuffer,
	privateKey: string,
): Promise<Body | null> {
	try {
		const bufferData = new Uint8Array(input);
		const encodedData: Uint8Array = await decryptData(bufferData, privateKey);
		const data: unknown = TruffleByte.decode(encodedData);

		if (!isStreamBody(data)) {
			console.warn("Received invalid stream body:", data);
			return null;
		}

		switch (data.event) {
			case "message":
				return data as Body & MessageBody;
			case "roomMemberJoin":
				return data as Body & RoomMemberJoinBody;
			case "roomMemberLeave":
				return data as Body & RoomMemberLeaveBody;
			case "userUpdate":
				return data as Body & UserUpdateBody;
			case "ping":
				return data as Body & PingBody;
			case "connect":
				return data as Body & ConnectBody;
			default:
				console.warn("Received unknown event:", data.event, data);
				return null;
		}
	} catch (error) {
		console.error(error);
	}

	return null;
}
