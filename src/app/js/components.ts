import tippy from "tippy.js";
import moment from "moment";
import { dom, type DomContext, html } from "@debutter/dom";
import { client } from "./main.ts";
import type { RoomMessage } from "../../lib/client.ts";

export function createRoomTab(name: string): DomContext {
	return dom(html`<div class="channel-tab"></div>`)
		.prop("data-channel-id", name) // NOTE: is name is not always going to be the id
		.append(
			`<span class="ic-text-size ic-hashtag"></span>`,
			dom(html`<span name="channel-name"></span>`).text(name)
		);
}

export function createUserTag(name: string, color: string) {
	return dom(html`<span class="user-tag"></span>`)
		.text(name)
		.style("color", color).element;
}

export function createUserChip(name: string, color: string, online = true) {
	const tagEle = createUserTag(name, color);

	if (!online) tagEle.classList.add("offline");

	return dom(html`<div class="user-chip"></div>`).append(
		`<span class="ic-text-size ic-${
			online ? "green" : "gray"
		}-dot"></span>`,
		tagEle
	);
}

export function createMessage(message: RoomMessage) {
	// Create timestamp element with tippy
	const timestampEle = dom(
		html`<span class="message-timestamp"></span>`
	).text(moment(message.timestamp).format("LT")).element;

	// @ts-ignore
	tippy(timestampEle, {
		content: moment(message.timestamp).format("LLLL"),
		theme: "tomato"
	});

	// Create attachment components
	const attachments = message.attachments.map((attachment) =>
		createAttachment(attachment)
	);

	// Return full component
	return dom(html`<div class="message"></div>`).append(
		dom(html`<div class="message-header"></div>`).append(
			createUserTag(message.author.username, message.author.color),
			timestampEle
		),
		dom(html`<div class="message-content"></div>`).append(
			dom(html`<div class="message-body"></div>`).text(message.content),
			dom(html`<div class="message-attachments"></div>`).append(
				...attachments
			)
		)
	).element;
}

function createAttachment(attachmentPath: string) {
	const slashIndex = attachmentPath.lastIndexOf("/");
	const fileName = attachmentPath.substring(slashIndex + 1);

	return dom(html`<a class="file-chip"></a>`)
		.prop("href", `${client.baseUrl.http}/${attachmentPath}`)
		.text(fileName);
}
