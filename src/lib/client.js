import axios from "axios";
import eventemitter3 from "eventemitter3";
import { decryptMessage, generateKeyPair, signMessage } from "./cryption.js";
import RoomManager, { Room } from "./roomManager.js";
import UserManager, { User } from "./userManager.js";
import { ClientError } from "./builtinErrors.js";
import AttachmentManager from "./attachmentManager.js";

export { generateKeyPair };

export class Client extends eventemitter3 {
	#baseUrl;
	#token;

	/**
	 * @param {{ http: string, ws: string }} baseUrl
	 */
	constructor(baseUrl) {
		super();

		this.stream = null;
		this.user = null;
		this.keyPair = {
			publicKey: null,
			privateKey: null,
		};
		this.rooms = new RoomManager(this);
		this.users = new UserManager(this);
		this.attachments = new AttachmentManager(this);

		this.#baseUrl = baseUrl;
	}

	get baseUrl() {
		return this.#baseUrl;
	}

	/**
	 * @param {string} value
	 */
	set token(value) {
		if (this.authorized) throw new Error("Client already has a token");

		this.#token = value;
	}
	get token() {
		return this.#token;
	}

	get authorized() {
		return typeof this.#token !== "undefined";
	}

	request(options) {
		return axios
			.create({
				baseURL: this.baseUrl.http,
				headers: this.authorized
					? { Authorization: `Bearer ${this.token}` }
					: {},
			})
			.request(options);
	}

	async syncClient() {
		return new Promise((resolve, reject) => {
			this.request({
				method: "get",
				url: "/sync/client",
			})
				.then(async (res) => {
					const { rooms, users, you } = res.data;

					// Update the rooms cache
					for (const room of rooms) {
						if (this.rooms.cache.has(room.name)) {
							const cachedRoom = this.rooms.cache.get(room.name);

							cachedRoom.description = room.description;
							cachedRoom.key = room.key;
							cachedRoom.members = new Set(room.members);
						} else {
							this.rooms.cache.set(
								room.name,
								new Room(
									this,
									room.name,
									room.description,
									room.key,
									room.members,
								),
							);
						}
					}

					// Update the users cache
					for (const user of users) {
						if (this.users.cache.has(user.username)) {
							const cachedUser = this.users.cache.get(user.username);

							cachedUser.username = user.username;
							cachedUser.color = user.color;
							cachedUser.offline = user.offline;
						} else {
							this.users.cache.set(
								user.username,
								new User(this, user.username, user.color, user.offline),
							);
						}
					}

					// Update the client users cache
					if (this.user === null) {
						this.user = new User(this, you.username, you.color, you.offline);
						this.users.cache.set(you.username, this.user);
					} else {
						this.user.username = you.username;
						this.user.color = you.color;
						this.user.offline = you.offline;
					}

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

	async syncMemory() {
		return new Promise((resolve) => {
			this.request({
				method: "get",
				url: "/sync/memory",
			})
				.then(() => resolve(true))
				.catch((err) =>
					reject(
						typeof err?.response === "object"
							? new ClientError(err.response.data, err)
							: err,
					),
				);
		});
	}

	async setKeyPair(publicKey, privateKey) {
		return new Promise((resolve, reject) => {
			if (!this.authorized) return resolve(false); // TODO: throw an error

			this.keyPair = {
				publicKey,
				privateKey,
			};

			this.request({
				method: "get",
				url: "/keys/nonce",
			})
				.then(async (res) => {
					const { nonce } = res.data;

					const signedNonce = await signMessage(nonce, this.keyPair.privateKey);

					this.request({
						method: "post",
						url: "/keys/verify",
						data: {
							signedNonce,
							publicKey: this.keyPair.publicKey,
						},
					})
						.then(() => resolve(true))
						.catch((err) =>
							reject(
								typeof err?.response === "object"
									? new ClientError(err.response.data, err)
									: err,
							),
						);
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

	async login(token, publicKey, privateKey) {
		this.token = token;

		await this.setKeyPair(publicKey, privateKey);

		await this.syncClient();

		// Connect to event stream
		this.stream = new WebSocket(`${this.baseUrl.ws}/stream`, [
			"Authorization",
			this.token,
		]);

		// Add stream event listeners
		this.stream.addEventListener("open", () => {
			this.emit("ready");

			this.syncMemory();
		});
		this.stream.addEventListener("message", async (event) => {
			const data = await parseStreamData(event.data, this.keyPair.privateKey);

			switch (data.event) {
				case "ping": {
					this.emit("ping", data.ping);
					break;
				}
				case "updateMember": {
					switch (data.state) {
						case "join":
							this.emit(
								"roomMemberJoin",
								data.username,
								data.room,
								data.timestamp,
							);
							break;
						case "leave":
							this.emit(
								"roomMemberLeave",
								data.username,
								data.room,
								data.timestamp,
							);
							break;
						default:
							// TODO: Throw out of date client error
							break;
					}
					break;
				}
				case "updateUser": {
					this.emit("userUpdate", data.username, data.data, data.timestamp);
					break;
				}
				case "message": {
					const authorData = {
						color: data.author.color,
						offline: data.author.offline,
						username: data.author.username,
						timestamp: data.timestamp,
					};
					this.users.update(data.author.username, authorData);
					const message = new RoomMessage(
						this,
						data.author.username,
						data.room,
						data,
					);

					this.emit("roomMemberMessage", message);
					break;
				}
			}
		});
	}
}

export async function locateHomeserver(domain) {
	try {
		// Get the base URL of the homeserver
		const wellKnownRes = await axios.get(`https://${domain}/.well-known/wonk`);
		const {
			homeserver: { base_url },
		} = wellKnownRes.data;

		// Get the namespace of the homeserver
		const baseRes = await axios.get(base_url);
		const { namespace } = baseRes.data;

		// Check if the namespace matches the domain
		if (namespace !== domain) return null; // TODO: resolve namespace conflict

		// Return the namespace and base URL
		const url = new URL(base_url);
		const wsProtocol = url.protocol === "https:" ? "wss://" : "ws://";
		const pathname = url.pathname.replace(/\/$/g, "");

		return {
			namespace,
			baseUrl: {
				http: `${url.origin}${pathname}`,
				ws: `${wsProtocol}${url.host}${pathname}`,
			},
		};
	} catch {
		return null;
	}
}

async function parseStreamData(input, privateKey) {
	let data = input;

	try {
		data = JSON.parse(data);
		data = await decryptMessage(data, privateKey);
		data = JSON.parse(data);
	} catch (error) {
		console.error(error);
	}

	return data;
}

class RoomMessage {
	constructor(client, username, roomName, msgData) {
		Object.defineProperty(this, "client", { value: client });

		this._username = username;
		this._roomName = roomName;

		this.content = msgData.content;
		this.attachments = msgData.attachments;
		this.timestamp = msgData.timestamp;
	}

	get room() {
		return this.client.rooms.cache.get(this._roomName);
	}
	get author() {
		return this.client.users.cache.get(this._username);
	}
}
