import { decryptData } from "./cryption.ts";
import * as JsBin from "@debutter/jsbin";

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
	privateKey: string,
): Promise<Body | null> {
	try {
		const bufferData = new Uint8Array(input);
		const encodedData: Uint8Array = await decryptData(bufferData, privateKey);
		const data: unknown = JsBin.decode(encodedData);

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
