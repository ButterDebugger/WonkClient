import { AxiosError } from "axios";
import { ClientError } from "./builtinErrors.ts";
import type { Client } from "./client.ts";
import { encryptText } from "./cryption.ts";
import type { Attachment } from "./mediaManager.ts";

export default class RoomManager {
	client: Client;
	cache: Map<string, Room>;

	constructor(client: Client) {
		this.client = client;

		this.cache = new Map();

		client.on("roomMemberJoin", (username, roomId) => {
			const room = this.cache.get(roomId);
			if (!room) return;

			room.members.add(username);
		});
		client.on("roomMemberLeave", (username, roomId) => {
			const room = this.cache.get(roomId);
			if (!room) return;

			room.members.delete(username);
		});
	}

	join(roomId: string): Promise<Room> {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/room/${roomId}/join`,
				})
				.then(async (res) => {
					const { id, name, description, key, members } = res.data;

					const room = new Room(this.client, id, name, description, key, members);
					this.cache.set(id, room);

					resolve(room);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError ? new ClientError(err?.response?.data, err) : err,
					),
				);
		});
	}

	joinWithInvite(inviteCode: string): Promise<Room> {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/room/use-invite`,
					data: {
						code: inviteCode,
					},
				})
				.then(async (res) => {
					const { id, name, description, key, members } = res.data;

					const room = new Room(this.client, id, name, description, key, members);
					this.cache.set(id, room);

					resolve(room);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError ? new ClientError(err?.response?.data, err) : err,
					),
				);
		});
	}

	leave(roomId: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/room/${roomId}/leave`,
				})
				.then((res) => {
					if (!res.data.success) return resolve(false);

					this.cache.delete(roomId);
					resolve(true);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError ? new ClientError(err?.response?.data, err) : err,
					),
				);
		});
	}

	create(roomName: string): Promise<{
		roomId: string;
	}> {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/room/create`,
					data: {
						name: roomName,
					},
				})
				.then((res) => {
					resolve(res.data);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError ? new ClientError(err?.response?.data, err) : err,
					),
				);
		});
	}

	fetch(roomId: string, ignoreCache = false): Promise<Room> {
		return new Promise((resolve, reject) => {
			const existingRoom = this.cache.get(roomId);
			if (!ignoreCache && existingRoom) return resolve(existingRoom);

			this.client
				.request({
					method: "get",
					url: `/room/${roomId}/info`,
				})
				.then(async (res) => {
					const { id, name, description, key, members } = res.data;

					const room = new Room(this.client, id, name, description, key, members);
					this.cache.set(id, room);

					resolve(room);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError ? new ClientError(err?.response?.data, err) : err,
					),
				);
		});
	}
}

export interface MessageOptions {
	text: string;
	attachments: Attachment[];
}

export class Room {
	client: Client;
	id: string;
	name: string;
	description: string;
	publicKey: string;
	/** Set of user ids */
	members: Set<string>;

	constructor(
		client: Client,
		id: string,
		name: string,
		description: string,
		key: string,
		members: Iterable<string>,
	) {
		this.client = client;

		this.id = id;
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
					url: `/room/${this.id}/message`,
					data: {
						message: encryptedMessage,
					},
				})
				.then((res) => {
					resolve(res.data);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError ? new ClientError(err?.response?.data, err) : err,
					),
				);
		});
	}

	async createInvite(): Promise<string | null> {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/room/${this.id}/create-invite`,
				})
				.then((res) => {
					const { code, success } = res.data;
					if (!success || !code) return resolve(null);

					resolve(code);
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError ? new ClientError(err?.response?.data, err) : err,
					),
				);
		});
	}

	refresh() {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "get",
					url: `/room/${this.id}/info`,
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
						err instanceof AxiosError ? new ClientError(err?.response?.data, err) : err,
					),
				);
		});
	}
}
