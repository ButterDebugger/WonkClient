import { ClientError } from "./builtinErrors.js";
import type { Client } from "./client.ts";

export default class UserManager {
	client: Client;
	cache: Map<string, User>;

	constructor(client: Client) {
		Object.defineProperty(this, "client", { value: client });

		this.cache = new Map();

		this.client.on("userUpdate", (username, data) =>
			this.update(username, data),
		);
	}

	update(username, data) {
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
					data.timestamp,
				),
			);
		}
	}

	subscribe(username) {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/users/${username}/subscribe`,
				})
				.then(async () => {
					resolve(true);
				})
				.catch((err) =>
					reject(
						typeof err?.response === "object"
							? new ClientError(err.response.data, err)
							: err,
					),
				);
		});
	}
	unsubscribe(username) {
		return new Promise((resolve, reject) => {
			this.client
				.request({
					method: "post",
					url: `/users/${username}/unsubscribe`,
				})
				.then(async () => {
					resolve(true);
				})
				.catch((err) =>
					reject(
						typeof err?.response === "object"
							? new ClientError(err.response.data, err)
							: err,
					),
				);
		});
	}
	fetch(username: string, ignoreCache = false) {
		return new Promise((resolve, reject) => {
			if (!ignoreCache && this.cache.has(username))
				return resolve(this.cache.get(username));

			this.client
				.request({
					method: "get",
					url: `/users/${username}/fetch`,
				})
				.then(async (res) => {
					const { username, data } = res.data;

					this.update(username, data);

					resolve(this.cache.get(username));
				})
				.catch((err) =>
					reject(
						typeof err?.response === "object"
							? new ClientError(err.response.data, err)
							: err,
					),
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
		timestamp = Date.now(),
	) {
		Object.defineProperty(this, "client", { value: client });

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
