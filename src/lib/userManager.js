import { ClientError } from "./builtinErrors.js";

export default class UserManager {
	constructor(client) {
		Object.defineProperty(this, "client", { value: client });

		this.cache = new Map();

		this.client.on("userUpdate", (username, data) => this.update(username, data));
	}

	update(username, data) {
		if (this.cache.has(username)) {
			let cachedUser = this.cache.get(username);

			if (cachedUser.cacheTime >= data.timestamp) return; // Don't cache

			cachedUser.color = data.color;
			cachedUser.offline = data.offline;
			cachedUser.username = data.username;
		} else {
			this.users.cache.set(username, new User(this.client, data.username, data.color, data.offline, data.timestamp));
		}
	}

	subscribe(username) {
		return new Promise((resolve) => {
			this.client.request
				.post(`/users/${username}/subscribe`)
				.then(async () => {
					resolve(true);
				})
				.catch((err) => reject(typeof err?.response == "object" ? new ClientError(err.response.data, err) : err));
		});
	}
	unsubscribe(username) {
		return new Promise((resolve) => {
			this.client.request
				.post(`/users/${username}/unsubscribe`)
				.then(async () => {
					resolve(true);
				})
				.catch((err) => reject(typeof err?.response == "object" ? new ClientError(err.response.data, err) : err));
		});
	}
	fetch(username, ignoreCache = false) {
		return new Promise((resolve) => {
			if (!ignoreCache && this.cache.has(username)) return resolve(this.cache.get(username));

			this.client.request
				.get(`/users/${username}/fetch`)
				.then(async (res) => {
					let { username, data } = res.data;

					this.update(username, data);
					
					resolve(this.cache.get(username));
				})
				.catch((err) => reject(typeof err?.response == "object" ? new ClientError(err.response.data, err) : err));
		});
	}
}

export class User {
	constructor(client, username, color, offline, timestamp = Date.now()) {
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
