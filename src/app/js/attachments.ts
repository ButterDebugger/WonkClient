// @ts-ignore
import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { lockModal, showModal, unlockModal } from "./modal.ts";
import { client } from "./main.ts";
import type { Attachment } from "../../lib/attachmentManager.ts";
import { setAttachmentAnimation } from "./views/room.ts";

/** Room names mapped to file input elements */
const roomFiles = new Map();
/** Room names mapped to an array of attachment objects */
const roomAttachments = new Map();

export function showAttachmentModal(roomName: string) {
	const $container = dom(`<div class="container flex-column"></div>`);
	const $inputBox = dom(`<div class="attachment-box">
            <span class="ic-normal ic-upload"></span>
            <span class="no-select top-text">Drag and drop files here</span>
            <span class="no-select sub-text">or click to select files</span>
        </div>`);
	const $fileList = dom(`<div class="attachment-list"></div>`);
	const $input = getOrCreateFileInput(roomName);

	$inputBox.on("click", () => {
		$input.element.click();
	});

	const updateModal = () => {
		// Update the file list
		while ($fileList.element.firstChild) {
			$fileList.element.removeChild($fileList.element.lastChild);
		}

		for (const file of $input.element.files) {
			$fileList.append(
				dom(`<span class="file-chip no-select"></span>`).text(file.name),
			);
		}

		// Update the upload button
		if ($input.element.validity.valid) {
			setAttachmentAnimation(roomName, true);
		} else {
			setAttachmentAnimation(roomName, false);
		}

		// Upload the attachments
		lockModal();
		uploadAttachments(roomName).finally(() => unlockModal());
	};

	$input.on("input", updateModal);
	updateModal();

	$container.append($inputBox, $fileList);

	showModal("Add Attachments", $container);
}

async function uploadAttachments(roomName: string) {
	const files = getRoomFiles(roomName);
	const attachments: Attachment[] = [];

	if (files === null) {
		roomAttachments.set(roomName, []);
		return;
	}

	for (const file of files) {
		attachments.push(client.attachments.create(file));
	}

	if (attachments.length > 0) await client.attachments.upload(attachments);
	roomAttachments.set(roomName, attachments);
}

function getOrCreateFileInput(roomName: string) {
	if (roomFiles.has(roomName)) return roomFiles.get(roomName);

	const $input = dom(`<input type="file" required multiple>`);

	roomFiles.set(roomName, $input);
	return $input;
}

function getRoomFiles(roomName: string): FileList | null {
	if (!roomFiles.has(roomName)) return null;

	return roomFiles.get(roomName).element.files;
}

export function getRoomAttachments(roomName: string) {
	if (!roomAttachments.has(roomName)) return [];

	return roomAttachments.get(roomName);
}

export function clearRoomAttachments(roomName: string) {
	roomAttachments.delete(roomName);
	setAttachmentAnimation(roomName, false);

	const inputEle = getOrCreateFileInput(roomName).element;

	inputEle.value = "";
	inputEle.dispatchEvent(new Event("input"));
}
