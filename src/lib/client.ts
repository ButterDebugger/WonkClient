import axios, { type AxiosRequestConfig } from "axios";
import eventemitter3 from "eventemitter3";
import { decryptMessage, generateKeyPair, signMessage } from "./cryption.js";
import RoomManager, { Room } from "./roomManager.ts";
import UserManager, { User } from "./userManager.ts";
import { ClientError, errorCodes } from "./builtinErrors.js";
import AttachmentManager from "./attachmentManager.ts";

export { generateKeyPair, ClientError, errorCodes };

export interface KeyPair {
	publicKey: string;
	privateKey: string;
}

export interface BaseUrl {
	http: string;
	ws: string;
}

export class Client extends eventemitter3 {
	#baseUrl: BaseUrl;
	#token: string;
	#keyPair: KeyPair;

	rooms: RoomManager;
	stream: WebSocket | null;
	user: User;
	users: UserManager;
	attachments: AttachmentManager;

	constructor(
		token: string,
		publicKey: string,
		privateKey: string,
		baseUrl: BaseUrl,
	) {
		super();

		this.stream = null;
		this.rooms = new RoomManager(this);
		this.users = new UserManager(this);
		this.attachments = new AttachmentManager(this);

		this.#baseUrl = baseUrl;
		this.#token = token;
		this.#keyPair = {
			publicKey,
			privateKey,
		};

		this.#init();
	}

	get baseUrl() {
		return this.#baseUrl;
	}

	get token() {
		return this.#token;
	}

	request(options: AxiosRequestConfig) {
		return axios
			.create({
				baseURL: this.baseUrl.http,
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			})
			.request(options);
	}

	static regularRequest(
		baseUrl: BaseUrl,
		options: AxiosRequestConfig,
		token?: string,
	) {
		return axios
			.create({
				baseURL: baseUrl.http,
				headers:
					typeof token === "string" ? { Authorization: `Bearer ${token}` } : {},
			})
			.request(options);
	}

	/** @throws if the key pair could not be set */
	static async refreshKeyPair(
		token: string,
		publicKey: string,
		privateKey: string,
		baseUrl: BaseUrl,
	): Promise<void> {
		try {
			const res = await Client.regularRequest(
				// Throws an error
				baseUrl,
				{
					method: "get",
					url: "/keys/nonce",
				},
				token,
			);

			const { nonce } = res.data;
			const signedNonce = await signMessage(nonce, privateKey);

			await Client.regularRequest(
				// Throws an error
				baseUrl,
				{
					method: "post",
					url: "/keys/verify",
					data: {
						signedNonce,
						publicKey,
					},
				},
				token,
			);
		} catch (err) {
			throw typeof err?.response === "object"
				? new ClientError(err.response.data, err)
				: err;
		}
	}

	/** @throws if the key pair could not be set */
	static async login(
		token: string,
		publicKey: string,
		privateKey: string,
		baseUrl: BaseUrl,
	): Promise<Client> {
		await Client.refreshKeyPair(token, publicKey, privateKey, baseUrl); // Throws an error

		return new Client(token, publicKey, privateKey, baseUrl);
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
						const cachedRoom = this.rooms.cache.get(room.name);

						if (cachedRoom) {
							cachedRoom.description = room.description;
							cachedRoom.publicKey = room.key;
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
						const cachedUser = this.users.cache.get(user.username);

						if (cachedUser) {
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
					if (typeof this.user === "undefined") {
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
		return new Promise((resolve, reject) => {
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

	async #init() {
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
			const data = await parseStreamData(event.data, this.#keyPair.privateKey);

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
						data.content,
						data.attachments,
						data.timestamp,
					);

					this.emit("roomMemberMessage", message);
					break;
				}
			}
		});
	}
}

export async function locateHomeserver(domain: string) {
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
	#username: string;
	#roomName: string;

	client: Client;
	content: string;
	attachments: string[];
	timestamp: number;

	constructor(
		client: Client,
		username: string,
		roomName: string,
		content: string,
		attachments: string[],
		timestamp: number,
	) {
		Object.defineProperty(this, "client", { value: client });

		this.#username = username;
		this.#roomName = roomName;

		this.content = content;
		this.attachments = attachments;
		this.timestamp = timestamp;
	}

	get room() {
		return this.client.rooms.cache.get(this.#roomName);
	}
	get author() {
		return this.client.users.cache.get(this.#username);
	}
}
