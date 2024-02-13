import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.2/+esm";
import eventemitter3 from "https://cdn.jsdelivr.net/npm/eventemitter3@5.0.1/+esm";
import EventSource from "https://cdn.jsdelivr.net/npm/eventsource@2.0.2/+esm";
import { decryptMessage, generateKeyPair } from "./cryption.js";
import RoomManager, { Room } from "./roomManager.js";
import UserManager, { User } from "./userManager.js";
import { ClientError } from "./builtinErrors.js";
import AttachmentManager from "./attachmentManager.js";

export { generateKeyPair };

export class Client extends eventemitter3 {
	static baseUrl = "https://wonk.debutter.dev";

	constructor() {
		super();

		this.stream = null;
		this.token = null;
		this.user = null;
		this.keyPair = {
			publicKey: null,
			privateKey: null
		};
		this.rooms = new RoomManager(this);
		this.users = new UserManager(this);
		this.attachments = new AttachmentManager(this);
		
		this.request = axios.create({
			baseURL: Client.baseUrl,
			headers: {}
		});
	}

	async syncClient() {
		return new Promise((resolve, reject) => {
			this.request
				.get(`/sync/client`)
				.then(async (res) => {
					let { rooms, users, you } = res.data;

					// Update the rooms cache
					for (let room of rooms) {
						if (this.rooms.cache.has(room.name)) {
							let cachedRoom = this.rooms.cache.get(room.name);

							cachedRoom.description = room.description;
							cachedRoom.key = room.key;
							cachedRoom.members = new Set(room.members);
						} else {
							this.rooms.cache.set(room.name, new Room(this, room.name, room.description, room.key, room.members));
						}
					}

					// Update the users cache
					for (let user of users) {
						if (this.users.cache.has(user.username)) {
							let cachedUser = this.users.cache.get(user.username);

							cachedUser.username = user.username;
							cachedUser.color = user.color;
							cachedUser.offline = user.offline;
						} else {
							this.users.cache.set(user.username, new User(this, user.username, user.color, user.offline));
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
				.catch((err) => reject(typeof err?.response == "object" ? new ClientError(err.response.data, err) : err));
		});
	}

	async syncMemory() {
		return new Promise((resolve) => {
			this.request
				.get(`/sync/memory`)
				.then(async () => {
					resolve(true);
				})
				.catch((err) => reject(typeof err?.response == "object" ? new ClientError(err.response.data, err) : err));
		});
	}

	async login(token, publicKey, privateKey) {
		this.token = token;
		this.keyPair.publicKey = publicKey;
		this.keyPair.privateKey = privateKey;
		
		this.request = axios.create({
			baseURL: Client.baseUrl,
			headers: {
				Authorization: this.token
			}
		});

		await this.syncClient();

		// Connect to event stream
		this.stream = new EventSource(`${Client.baseUrl}/stream`, {
			headers: {
				Authorization: this.token
			}
		});

		// Add stream event listeners
		this.stream.once("connect", () => {
			this.emit("ready");
			
			this.syncMemory();
		});
		this.stream.on("ping", async ({ data }) => {
			data = await parseStreamData(data, this.keyPair.privateKey);

			this.emit("ping", data.ping);
		});
		this.stream.on("updateMember", async ({ data }) => {
			data = await parseStreamData(data, this.keyPair.privateKey);
			
			switch (data.state) {
				case "join":
					this.emit("roomMemberJoin", data.username, data.room, data.timestamp);
					break;
				case "leave":
					this.emit("roomMemberLeave", data.username, data.room, data.timestamp);
					break;
				default:
					// TODO: Throw out of date client error
					break;
			}
		});
		this.stream.on("updateUser", async ({ data }) => {
			data = await parseStreamData(data, this.keyPair.privateKey);

			this.emit("userUpdate", data.username, data.data, data.timestamp);
		});
		this.stream.on("message", async ({ data }) => {
			data = await parseStreamData(data, this.keyPair.privateKey);

			let authorData = {
				color: data.author.color,
				offline: data.author.offline,
				username: data.author.username,
				timestamp: data.timestamp
			};
			this.users.update(data.author.username, authorData);
			let message = new RoomMessage(this, data.author.username, data.room, data);

			this.emit("roomMemberMessage", message);
		});
	}
}

async function parseStreamData(data, privateKey) {
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
