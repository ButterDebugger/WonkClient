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
		// Connect to event stream
		this.#socket = new WebSocket(`${this.client.baseUrl.ws}/stream`, [
			"Authorization",
			this.client.token
		]);
		this.#socket.binaryType = "arraybuffer";

		// Add stream event listeners
		this.#socket.addEventListener("open", () => {
			this.client.emit("ready");
		});
		this.#socket.addEventListener("message", async (event) => {
			const data = await parseStreamData(
				event.data,
				this.client.privateKey
			);
			if (data === null) return;

			switch (data.event) {
				case "ping": {
					const pingData = <PingBody>data;

					this.client.emit("ping", pingData.ping);
					break;
				}
				case "updateMember": {
					const updateMemberData = <UpdateMemberBody>data;

					switch (updateMemberData.state) {
						case "join":
							this.client.emit(
								"roomMemberJoin",
								updateMemberData.username,
								updateMemberData.room,
								updateMemberData.timestamp
							);
							break;
						case "leave":
							this.client.emit(
								"roomMemberLeave",
								updateMemberData.username,
								updateMemberData.room,
								updateMemberData.timestamp
							);
							break;
						default:
							// TODO: Throw out of date client error
							break;
					}
					break;
				}
				case "updateUser": {
					const updateUserData = <UpdateUserBody>data;

					this.client.emit(
						"userUpdate",
						updateUserData.username,
						updateUserData.data,
						updateUserData.timestamp
					);
					break;
				}
				case "message": {
					const messageData = <MessageBody>data;

					const authorData = {
						color: messageData.author.color,
						offline: messageData.author.offline,
						username: messageData.author.username,
						timestamp: messageData.timestamp
					};
					this.client.users.update(
						messageData.author.username,
						authorData
					);

					const message = new RoomMessage(
						this.client,
						messageData.author.username,
						messageData.room,
						messageData.content,
						messageData.attachments,
						messageData.timestamp
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

	subscribe(subscriptions: string[]) {
		// TODO: test and implement
		if (!this.#socket) return;

		this.#socket.send(
			TruffleByte.encode({
				event: "listen",
				subscriptions: subscriptions
			})
		);
	}
}

/*
 * Stream body types
 */

export interface StreamBody {
	event: "connect" | "message" | "ping" | "updateMember" | "updateUser";
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
export interface UpdateMemberBody extends StreamBody {
	event: "updateMember";
	state: "join" | "leave";
	username: string;
	room: string;
	timestamp: number;
}
export interface UpdateUserBody extends StreamBody {
	event: "updateUser";
	username: string;
	data: UserData;
	timestamp: number;
}
export interface MessageBody extends StreamBody {
	event: "message";
	author: UserData;
	room: string;
	content: string;
	attachments: string[];
	timestamp: number;
}

/*
 * Stream data types
 */

export interface UserData {
	username: string;
	color: string;
	offline: boolean;
	timestamp: number;
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
	privateKey: string
): Promise<Body | null> {
	try {
		const bufferData = new Uint8Array(input);
		const encodedData: Uint8Array = await decryptData(
			bufferData,
			privateKey
		);
		const data: unknown = TruffleByte.decode(encodedData);

		if (!isStreamBody(data)) {
			console.warn("Received invalid stream body:", data);
			return null;
		}

		switch (data.event) {
			case "message":
				return data as Body & MessageBody;
			case "updateMember":
				return data as Body & UpdateMemberBody;
			case "updateUser":
				return data as Body & UpdateUserBody;
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
