export default class AttachmentManager {
	constructor(client) {
		Object.defineProperty(this, "client", { value: client });
	}

	create(content) {
		return new Attachment(this.client, content);
	}

	async upload(attachments, progress) {
		let formData = new FormData();
		for (let attachment of attachments) {
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
				for (let result of res.data) {
					let attachment = attachments.find(
						// TODO: implement a better way of matching attachments
						(attach) =>
							attach.file.name === result.filename &&
							attach.file.size === result.size,
					);

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
	constructor(client, content) {
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
