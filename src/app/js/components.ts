import tippy from "tippy.js";
import moment from "moment";
import { dom, type DomContext, html, parse } from "@debutter/dough";
import { client } from "./main.ts";
import type { RoomMessage } from "../../lib/client.ts";
import { Marked } from "marked";
import DOMPurify from "dompurify";

const marked = new Marked({
	async: false,
	breaks: true
});
const sanitizeConfig = {
	ALLOWED_TAGS: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"p",
		"strong",
		"em",
		"a",
		"br",
		"span",
		"code",
		"pre",
		"table",
		"thead",
		"tbody",
		"tr",
		"th",
		"td",
		"blockquote"
	]
};

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
		`<span class="ic-text-size ic-${online ? "green" : "gray"
		}-dot"></span>`,
		tagEle
	);
}

export async function createMessage(message: RoomMessage) {
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

	// Create markdown message content
	const markdown = <string>marked.parse(
		// Remove the most common zero width characters from the start
		// https://github.com/markedjs/marked/issues/2139
		// biome-ignore lint/suspicious/noMisleadingCharacterClass: Its needed, probably
		message.content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "")
	);
	const content = parse(
		`<div class="message-body">${DOMPurify.sanitize(
			markdown,
			sanitizeConfig
		)}</div>`
	);

	// Return full component
	const author = await message.getAuthor();

	return dom(html`<div class="message"></div>`).append(
		dom(html`<div class="message-header"></div>`).append(
			createUserTag(author.username, author.color),
			timestampEle
		),
		dom(html`<div class="message-content"></div>`).append(
			content,
			dom(html`<div class="message-attachments"></div>`).append(
				...attachments
			)
		)
	).element;
}

function createAttachment(attachmentLink: string) {
	const slashIndex = attachmentLink.lastIndexOf("/");
	const fileName = attachmentLink.substring(slashIndex + 1);

	return dom(html`<a class="file-chip"></a>`)
		.prop("href", attachmentLink)
		.prop("target", "_blank")
		.text(fileName);
}
