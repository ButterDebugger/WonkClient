import { AxiosError } from "axios";
import { ClientError } from "./builtinErrors.ts";
import type { Client } from "./client.ts";
import type { UserData } from "./dataStream.ts";

export default class UserManager {
	client: Client;
	cache: Map<string, User>;

	constructor(client: Client) {
		this.client = client;

		this.cache = new Map();

		this.client.on("userUpdate", (userId, userData, timestamp) =>
			this.update(userId, userData, timestamp)
		);
	}

	update(userId: string, userData: UserData, timestamp: number) {
		const cachedUser = this.cache.get(userId);

		if (cachedUser) {
			if (cachedUser.cacheTime >= timestamp) return; // Don't cache

			cachedUser.color = userData.color;
			cachedUser.offline = userData.offline;
			cachedUser.username = userData.username;
			cachedUser.cacheTime = timestamp;
		} else {
			this.cache.set(
				userId,
				new User(
					this.client,
					userData.id,
					userData.username,
					userData.color,
					userData.offline,
					timestamp
				)
			);
		}
	}

	fetch(userId: string, ignoreCache = false): Promise<User> {
		return new Promise((resolve, reject) => {
			const existingUser = this.cache.get(userId);
			if (!ignoreCache && existingUser) return resolve(existingUser);

			this.client
				.request({
					method: "get",
					url: `/user/${userId}/fetch`
				})
				.then(async (res) => {
					const { id, data } = res.data;

					// Update cache for the user
					this.update(id, data, Date.now());

					resolve(<User>this.cache.get(id));
				})
				.catch((err) =>
					reject(
						err instanceof AxiosError
							? new ClientError(err?.response?.data, err)
							: err
					)
				);
		});
	}
}

export class User {
	client: Client;
	id: string;
	username: string;
	color: string;
	offline: boolean;
	cacheTime: number;

	constructor(
		client: Client,
		id: string,
		username: string,
		color: string,
		offline: boolean,
		timestamp = Date.now()
	) {
		this.client = client;

		this.id = id;
		this.username = username;
		this.color = color;
		this.offline = offline;
		this.cacheTime = timestamp;
	}

	get online() {
		return !this.offline;
	}
	set online(value) {
		this.offline = !value;
	}
}
