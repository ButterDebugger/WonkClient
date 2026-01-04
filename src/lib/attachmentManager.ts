import { AxiosError, type AxiosProgressEvent } from "axios";
import { type Client, ClientError } from "./client.ts";

export default class AttachmentManager {
	client: Client;
	/** Max chunk size in bytes, cached number provided by the homeserver */
	#maxChunkSize: number | null = null;

	constructor(client: Client) {
		this.client = client;
	}

	create(content: File): Attachment {
		return new Attachment(this.client, content);
	}

	async getUploadInfo(): Promise<{ maxChunkSize: number }> {
		if (this.#maxChunkSize !== null) return {
			maxChunkSize: this.#maxChunkSize,
		};

		return this.client.request({
			method: "get",
			url: "/media/upload/info",
		})
			.then((res) => {
				const { maxChunkSize } = res.data as {
					maxChunkSize: number
				};

				// Update the cached value
				this.#maxChunkSize = maxChunkSize;

				return {
					maxChunkSize: maxChunkSize,
				};
			})
			.catch((err: unknown) => {
				throw err instanceof AxiosError
					? new ClientError(err?.response?.data, err)
					: err;
			});
	}
}

export class Attachment {
	client: Client;
	file: File;
	path: string | null;

	constructor(client: Client, content: File) {
		this.client = client;

		if (!(content instanceof File))
			throw new TypeError("Attachment must be a file.");

		this.file = content;
		this.path = null;
	}

	get uploaded() {
		return !(this.path === null);
	}

	async upload(progress?: (progressEvent: AxiosProgressEvent) => void) {
		const { maxChunkSize } = await this.client.attachments.getUploadInfo();

		// Hash the whole file
		const checksumBuffer = await crypto.subtle.digest("SHA-256", await this.file.arrayBuffer());
		const checksum = [...new Uint8Array(checksumBuffer)]
			.map(b => b.toString(16).padStart(2, "0"))
			.join("");

		// Split the file into chunks and hash each one
		const chunks: Blob[] = [];
		const hashes: string[] = [];

		for (let i = 0; i < this.file.size; i += maxChunkSize) {
			const chunk = this.file.slice(i, i + maxChunkSize);

			const hashBuffer = await crypto.subtle.digest("SHA-256", await chunk.arrayBuffer());
			const hash = [...new Uint8Array(hashBuffer)]
				.map(b => b.toString(16).padStart(2, "0"))
				.join("");

			chunks.push(chunk);
			hashes.push(hash);
		}

		// Initialize the upload
		const { uploadId } = await this.init(
			this.file.name,
			this.file.size,
			this.file.type,
			hashes
		);

		// Upload the chunks
		const chunkUploadPromises: Promise<boolean>[] = [];

		for (let i = 0; i < chunks.length; i++) {
			const promise = this.uploadChunk(uploadId, chunks[i]);

			chunkUploadPromises.push(promise);
		}

		await Promise.all(chunkUploadPromises);

		// Finalize the upload
		const success = await this.completeUpload(uploadId, checksum);

		if (success) {
			this.path = `${this.client.baseUrl.http}/media/${uploadId}/${this.file.name}`;
		}
	}

	private async init(
		filename: string,
		size: number,
		mimeType: string,
		hashes: string[]
	): Promise<{
		uploadId: string
	}> {
		return this.client.request({
			method: "post",
			url: "/media/upload/init",
			data: {
				name: filename,
				size,
				mimeType,
				hashes,
			},
		})
			.then((res) => {
				const { uploadId } = res.data as {
					uploadId: string
				};

				return {
					uploadId,
				};
			})
			.catch((err: unknown) => {
				throw err instanceof AxiosError
					? new ClientError(err?.response?.data, err)
					: err;
			});
	}

	private async uploadChunk(uploadId: string, chunk: Blob) {
		const formData = new FormData();
		formData.append("file", chunk);

		return this.client.request({
			method: "patch",
			url: `/media/upload/${uploadId}`,
			headers: {
				"Content-Type": "multipart/form-data",
			},
			data: formData,
		})
			.then((res) => {
				const { success } = res.data as {
					success: boolean
				};

				return success;
			})
			.catch((err: unknown) => {
				throw err instanceof AxiosError
					? new ClientError(err?.response?.data, err)
					: err;
			});
	}

	private async completeUpload(uploadId: string, checksum: string) {
		return this.client.request({
			method: "post",
			url: `/media/upload/${uploadId}/complete`,
			data: {
				checksum,
			},
		})
			.then((res) => {
				const { success } = res.data as {
					success: boolean
				};

				return success;
			})
			.catch((err: unknown) => {
				throw err instanceof AxiosError
					? new ClientError(err?.response?.data, err)
					: err;
			});
	}
}
