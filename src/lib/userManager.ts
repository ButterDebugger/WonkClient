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

		this.client.on("userUpdate", (username, data) =>
			this.update(username, data)
		);
	}

	update(username: string, data: UserData) {
		const cachedUser = this.cache.get(username);

		if (cachedUser) {
			if (cachedUser.cacheTime >= data.timestamp) return; // Don't cache

			cachedUser.color = data.color;
			cachedUser.offline = data.offline;
			cachedUser.username = data.username;
		} else {
			this.cache.set(
				username,
				new User(
					this.client,
					data.username,
					data.color,
					data.offline,
					data.timestamp
				)
			);
		}
	}

	subscribe(username: string) {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/user/${username}/subscribe`
				})
				.then(async () => {
					resolve(true);
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
	unsubscribe(username: string) {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/user/${username}/unsubscribe`
				})
				.then(async () => {
					resolve(true);
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
	fetch(username: string, ignoreCache = false): Promise<User> {
		return new Promise((resolve, reject) => {
			const existingUser = this.cache.get(username);
			if (!ignoreCache && existingUser) return resolve(existingUser);

			this.client
				.request({
					method: "get",
					url: `/user/${username}/fetch`
				})
				.then(async (res) => {
					const { username, data } = res.data;

					// Update cache for the user
					this.update(username, data);

					resolve(<User>this.cache.get(username));
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
	username: string;
	color: string;
	offline: boolean;
	cacheTime: number;

	constructor(
		client: Client,
		username: string,
		color: string,
		offline: boolean,
		timestamp = Date.now()
	) {
		this.client = client;

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
