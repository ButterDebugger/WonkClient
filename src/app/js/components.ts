import tippy from "tippy.js";
import moment from "moment";
import { dom, type DomContext, html, parse } from "@debutter/dom";
import { client } from "./main.ts";
import type { RoomMessage } from "../../lib/client.ts";
import markdownit from "markdown-it";
import DOMPurify from "dompurify";

const md = markdownit({
	breaks: true,
	linkify: true
});

// https://github.com/markdown-it/markdown-it/issues/211#issuecomment-508380611
const defaultParagraphRenderer =
	md.renderer.rules.paragraph_open ||
	((tokens, idx, options, env, self) =>
		self.renderToken(tokens, idx, options));
md.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
	let result = "";
	if (idx > 1) {
		const inline = tokens[idx - 2];
		const paragraph = tokens[idx];
		if (
			inline.type === "inline" &&
			inline.map &&
			inline.map[1] &&
			paragraph.map &&
			paragraph.map[0]
		) {
			const diff = paragraph.map[0] - inline.map[1];
			if (diff > 0) {
				result = "<br>".repeat(diff);
			}
		}
	}
	return result + defaultParagraphRenderer(tokens, idx, options, env, self);
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

	// Create markdown message content
	const markdown = md.render(message.content);
	const content = parse(
		`<div class="message-body">${DOMPurify.sanitize(markdown)}</div>`
	);

	// Return full component
	return dom(html`<div class="message"></div>`).append(
		dom(html`<div class="message-header"></div>`).append(
			createUserTag(message.author.username, message.author.color),
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

function createAttachment(attachmentPath: string) {
	const slashIndex = attachmentPath.lastIndexOf("/");
	const fileName = attachmentPath.substring(slashIndex + 1);

	return dom(html`<a class="file-chip"></a>`)
		.prop("href", `${client.baseUrl.http}/${attachmentPath}`)
		.text(fileName);
}
