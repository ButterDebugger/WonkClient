import type { AxiosProgressEvent } from "axios";
import { type Client, ClientError } from "./client.ts";

export default class AttachmentManager {
	client: Client;

	constructor(client: Client) {
		Object.defineProperty(this, "client", { value: client });
	}

	create(content: File): Attachment {
		return new Attachment(this.client, content);
	}

	async upload(
		attachments: Attachment[],
		progress?: (progressEvent: AxiosProgressEvent) => void,
	) {
		const formData = new FormData();
		for (const attachment of attachments) {
			formData.append("files", attachment.file);
		}

		await this.client
			.request({
				method: "post",
				url: "/upload",
				data: formData,
				headers: {
					"Content-Type": "multipart/form-data",
					Accept: "application/json",
				},
				onUploadProgress: progress,
			})
			.then((res) => {
				for (const result of res.data) {
					// TODO: implement a better way of matching attachments
					const attachment = attachments.find(
						(attach) =>
							attach.file.name === result.filename &&
							attach.file.size === result.size,
					);

					if (!attachment) continue;
					if (attachment.uploaded) continue;
					if (result.success) attachment.path = result.path;
				}
			})
			.catch((err) => {
				if (typeof err?.response === "object") {
					throw new ClientError(err.response.data, err);
				}

				throw err;
			});

		return true;
	}
}

export class Attachment {
	client: Client;
	file: File;
	path: string | null;

	constructor(client: Client, content: File) {
		Object.defineProperty(this, "client", { value: client });

		if (!(content instanceof File))
			throw new TypeError("Attachment must be a file.");

		this.file = content;
		this.path = null;
	}

	get uploaded() {
		return !(this.path === null);
	}

	async upload(progress) {
		return this.client.attachments.upload([this], progress);
	}
}
