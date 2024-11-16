import { AxiosError } from "axios";
import { ClientError } from "./builtinErrors.ts";
import type { Client } from "./client.ts";
import { encryptText } from "./cryption.ts";
import type { Attachment } from "./attachmentManager.ts";

export default class RoomManager {
	client: Client;
	cache: Map<string, Room>;

	constructor(client: Client) {
		this.client = client;

		this.cache = new Map();

		client.on("roomMemberJoin", (username, roomName) => {
			const room = this.cache.get(roomName);
			if (!room) return;

			room.members.add(username);
		});
		client.on("roomMemberLeave", (username, roomName) => {
			const room = this.cache.get(roomName);
			if (!room) return;

			room.members.delete(username);
		});
	}

	join(roomName: string): Promise<Room> {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/room/${roomName}/join`,
				})
				.then(async (res) => {
					const { name, description, key, members } = res.data;

					const room = new Room(this.client, name, description, key, members);
					this.cache.set(name, room);

					resolve(room);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError
							? new ClientError(err?.response?.data, err)
							: err,
					),
				);
		});
	}
	leave(roomName: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/room/${roomName}/leave`,
				})
				.then((res) => {
					if (!res.data.success) return resolve(false);

					this.cache.delete(roomName);
					resolve(true);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError
							? new ClientError(err?.response?.data, err)
							: err,
					),
				);
		});
	}
	create(roomName: string) {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/room/${roomName}/create`,
				})
				.then((res) => {
					resolve(res.data);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError
							? new ClientError(err?.response?.data, err)
							: err,
					),
				);
		});
	}

	fetch(roomName: string, ignoreCache = false) {}
}

export interface MessageOptions {
	text: string;
	attachments: Attachment[];
}

export class Room {
	client: Client;
	name: string;
	description: string;
	publicKey: string;
	members: Set<string>;

	constructor(
		client: Client,
		name: string,
		description: string,
		key: string,
		members: Iterable<string>,
	) {
		this.client = client;

		this.name = name;
		this.description = description;
		this.publicKey = key;
		this.members = new Set(members);
	}

	async send(options: MessageOptions) {
		const attachments = options.attachments
			.filter((attach) => attach.uploaded)
			.map((attach) => attach.path);

		const encryptedMessage = await encryptText(
			JSON.stringify({
				content: options.text,
				attachments: attachments,
			}),
			this.publicKey,
		);

		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/room/${this.name}/message`,
					data: {
						message: encryptedMessage,
					},
				})
				.then((res) => {
					resolve(res.data);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError
							? new ClientError(err?.response?.data, err)
							: err,
					),
				);
		});
	}

	refresh() {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "get",
					url: `/room/${this.name}/info`,
				})
				.then((res) => {
					if (!res.data.success) return resolve(false);

					this.description = res.data.description;
					this.publicKey = res.data.key;
					this.members = new Set(res.data.members);
					resolve(true);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError
							? new ClientError(err?.response?.data, err)
							: err,
					),
				);
		});
	}
}
