import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { EventEmitter } from "eventemitter3";
import { generateKeyPair, type KeyPair, signText } from "./cryption.ts";
import RoomManager, { Room } from "./roomManager.ts";
import UserManager, { User } from "./userManager.ts";
import { ClientError, errorCodes } from "./builtinErrors.ts";
import AttachmentManager from "./attachmentManager.ts";
import {
	type MessageBody,
	parseStreamData,
	type PingBody,
	type UpdateMemberBody,
	type UpdateUserBody
} from "./dataStream.ts";
import { Signature } from "openpgp";

export { generateKeyPair, ClientError, errorCodes };

export interface BaseUrl {
	http: string;
	ws: string;
}

export class Client extends EventEmitter {
	#baseUrl: BaseUrl;
	#token: string;
	#keyPair: KeyPair;

	rooms: RoomManager;
	stream: WebSocket | null;
	user!: User;
	users: UserManager;
	attachments: AttachmentManager;

	constructor(
		token: string,
		publicKey: string,
		privateKey: string,
		baseUrl: BaseUrl
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
			privateKey
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
					Authorization: `Bearer ${this.token}`
				}
			})
			.request(options);
	}

	static regularRequest(
		baseUrl: BaseUrl,
		options: AxiosRequestConfig,
		token?: string
	) {
		return axios
			.create({
				baseURL: baseUrl.http,
				headers:
					typeof token === "string"
						? { Authorization: `Bearer ${token}` }
						: {}
			})
			.request(options);
	}

	/** @throws if the key pair could not be set */
	async refreshKeyPair(): Promise<boolean> {
		return new Promise(async (resolve, reject) => {
			this.request({
				method: "post",
				url: `/me/publickey`,
				data: {
					publicKey: this.#keyPair.publicKey,
					signature: await signText(
						this.#keyPair.publicKey,
						this.#keyPair.privateKey
					)
				}
			})
				.then(async () => resolve(true))
				.catch((err) =>
					reject(
						err instanceof AxiosError
							? new ClientError(err?.response?.data, err)
							: err
					)
				);
		});
	}

	/** @throws if the key pair could not be set */
	static async login(
		token: string,
		publicKey: string,
		privateKey: string,
		baseUrl: BaseUrl
	): Promise<Client> {
		return new Client(token, publicKey, privateKey, baseUrl);
	}

	async syncClient() {
		return new Promise((resolve, reject) => {
			this.request({
				method: "get",
				url: "/me/info"
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
									room.members
								)
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
								new User(
									this,
									user.username,
									user.color,
									user.offline
								)
							);
						}
					}

					// Update the client users cache
					if (typeof this.user === "undefined") {
						this.user = new User(
							this,
							you.username,
							you.color,
							you.offline
						);
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
						err instanceof AxiosError
							? new ClientError(err?.response?.data, err)
							: err
					)
				);
		});
	}

	async #init() {
		await this.refreshKeyPair();

		await this.syncClient();

		// Connect to event stream
		this.stream = new WebSocket(`${this.baseUrl.ws}/stream`, [
			"Authorization",
			this.token
		]);
		this.stream.binaryType = "arraybuffer";

		// Add stream event listeners
		this.stream.addEventListener("open", () => {
			this.emit("ready");
		});
		this.stream.addEventListener("message", async (event) => {
			const data = await parseStreamData(
				event.data,
				this.#keyPair.privateKey
			);
			if (data === null) return;

			switch (data.event) {
				case "ping": {
					const pingData = <PingBody>data;

					this.emit("ping", pingData.ping);
					break;
				}
				case "updateMember": {
					const updateMemberData = <UpdateMemberBody>data;

					switch (updateMemberData.state) {
						case "join":
							this.emit(
								"roomMemberJoin",
								updateMemberData.username,
								updateMemberData.room,
								updateMemberData.timestamp
							);
							break;
						case "leave":
							this.emit(
								"roomMemberLeave",
								updateMemberData.username,
								updateMemberData.room,
								updateMemberData.timestamp
							);
							break;
						default:
							// TODO: Throw out of date client error
							break;
					}
					break;
				}
				case "updateUser": {
					const updateUserData = <UpdateUserBody>data;

					this.emit(
						"userUpdate",
						updateUserData.username,
						updateUserData.data,
						updateUserData.timestamp
					);
					break;
				}
				case "message": {
					const messageData = <MessageBody>data;

					const authorData = {
						color: messageData.author.color,
						offline: messageData.author.offline,
						username: messageData.author.username,
						timestamp: messageData.timestamp
					};
					this.users.update(messageData.author.username, authorData);

					const message = new RoomMessage(
						this,
						messageData.author.username,
						messageData.room,
						messageData.content,
						messageData.attachments,
						messageData.timestamp
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
		const wellKnownRes = await axios.get(
			`https://${domain}/.well-known/wonk`
		);
		const {
			homeserver: { base_url }
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
				ws: `${wsProtocol}${url.host}${pathname}`
			}
		};
	} catch {
		return null;
	}
}

export class RoomMessage {
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
		timestamp: number
	) {
		this.client = client;

		this.#username = username;
		this.#roomName = roomName;

		this.content = content;
		this.attachments = attachments;
		this.timestamp = timestamp;
	}

	get room(): Room {
		return <Room>this.client.rooms.cache.get(this.#roomName);
	}
	get author(): User {
		return <User>this.client.users.cache.get(this.#username);
	}
}
