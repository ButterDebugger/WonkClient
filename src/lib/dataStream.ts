import { decryptMessage } from "./cryption.ts";

/*
 * Event stream interfaces
 */

export interface StreamBody {
	event: string;
}
export interface PingBody extends StreamBody {
	event: "message";
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

export async function parseStreamData<Body extends StreamBody>(
	input: string,
	privateKey: string,
): Promise<Body | null> {
	try {
		// TODO: change this pipeline to something simpler
		const plainData: string = JSON.parse(input);
		const strData: string = <string>await decryptMessage(plainData, privateKey);
		return JSON.parse(strData);
	} catch (error) {
		console.error(error);
	}

	return null;
}
