import { dom, html } from "@debutter/dom";
import type { Room } from "../../../lib/roomManager.ts";
import {
	clearRoomAttachments,
	getRoomAttachments,
	showAttachmentModal
} from "../attachments.ts";
import { sendMessage } from "../main.ts";
import {
	createBlankView,
	getView,
	setView,
	switchView,
	type ViewWrapper
} from "../views.ts";
import { getOrCreateRoomInfoView } from "./room-info.ts";
import type { RoomMessage } from "../../../lib/client.ts";
import { createMessage } from "../components.ts";
import { getRoomsView } from "./rooms.ts";

export function getOrCreateRoomView(room: Room): ViewWrapper {
	// Return existing view
	const roomKey = `#${room.name}`;
	const existingView = getView(roomKey);
	if (existingView) return existingView;

	// Create new view
	const view = createBlankView();

	view.header.addClass("room");
	view.content.addClass("room");
	view.footer.addClass("room");
	view.backAction = () => {
		const view = getRoomsView();

		switchView(view);
	};

	// Create message input field
	const $messageInput = dom(
		html`<input type="text" name="message-input" maxlength="1000" />`
	)
		.on("keydown", ({ key }: KeyboardEvent) => {
			if (key === "Enter") send();
		})
		.prop("placeholder", `Message #${room.name}`);

	// Add send message handlers
	async function send() {
		const value: string = <string>$messageInput.prop("value");
		$messageInput.prop("value", "");

		if (value.length === 0) return;

		const result = await sendMessage(room.name, {
			text: value,
			attachments: getRoomAttachments(room.name)
		});

		clearRoomAttachments(room.name);

		if (!result) {
			alert("Failed to send message"); // TODO: make fancier
		}
	}

	// Append footer message box
	dom(view.footer).append(
		// Add attach icon to wrapper footer
		html`<div
			class="ic-normal-container"
			name="attachment-button"
			onclick=${() => showAttachmentModal(room.name)}
		>
			<span class="ic-normal ic-paperclip"></span>
		</div>`,

		// Add message input
		$messageInput,

		// Add send icon to wrapper footer
		html`<div class="ic-normal-container" onclick=${() => send()}>
			<span name="send-button" class="ic-normal ic-arrow-up"></span>
		</div>`
	);

	// Append header content
	dom(view.header).append(
		// Append room label to wrapper header
		dom(html`<span class="title"></span>`).text(room.name),
		dom(html`<span class="description"></span>`).text(room.description),

		// Append flex spacer
		`<div class="flex-spacer"></div>`,

		// Append more icon to wrapper header
		html`<div
			class="ic-small-container"
			onclick=${() => switchView(getOrCreateRoomInfoView(room))}
		>
			<span class="ic-small ic-ellipsis"></span>
		</div>`
	);

	// Save and return the view
	setView(roomKey, view);

	return view;
}

export function appendMessage(message: RoomMessage) {
	const view = getOrCreateRoomView(message.room);
	const canScroll =
		view.content.element.scrollHeight -
			Math.ceil(view.content.element.scrollTop) <=
		view.content.element.clientHeight;
	const messageEle = createMessage(message);
	view.content.append(messageEle);

	if (canScroll) {
		// @ts-ignore
		view.content.style["scroll-behavior"] = "unset";
		messageEle.scrollIntoView();
		// @ts-ignore
		view.content.style["scroll-behavior"] = "";
	}
}

export function setAttachmentAnimation(roomName: string, state: boolean) {
	const view = getView(`#${roomName}`);
	if (!view) return;

	const $attachBtn = view.footer.find('div[name="attachment-button"]');
	if (!$attachBtn) return;

	if (state) {
		$attachBtn.addClass("ring");
	} else {
		$attachBtn.removeClass("ring");
	}
}
