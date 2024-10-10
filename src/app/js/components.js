import tippy from "tippy.js";
import moment from "moment";
import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { client } from "./main";

export function createRoomTab(name) {
	return dom(`<div class="channel-tab"></div>`)
		.prop("data-channel-id", name) // NOTE: is name is not always going to be the id
		.append(
			`<span class="ic-text-size ic-hashtag"></span>`,
			dom(`<span name="channel-name"></span>`).text(name),
		).element;
}

export function createUserTag(name, color) {
	return dom(`<span class="user-tag"></span>`).text(name).style("color", color)
		.element;
}

export function createUserChip(name, color, online = true) {
	let tagEle = createUserTag(name, color);

	if (!online) tagEle.classList.add("offline");

	return dom(`<div class="user-chip"></div>`).append(
		`<span class="ic-text-size ic-${online ? "green" : "gray"}-dot"></span>`,
		tagEle,
	);
}

export function createMessage(message) {
	// Create timestamp element with tippy
	let timestampEle = dom(`<span class="message-timestamp"></span>`).text(
		moment(message.timestamp).format("LT"),
	).element;

	tippy(timestampEle, {
		content: moment(message.timestamp).format("LLLL"),
		theme: "tomato",
	});

	// Create attachment components
	let attachments = message.attachments.map((attachment) =>
		createAttachment(attachment),
	);

	// Return full component
	return dom(`<div class="message"></div>`).append(
		dom(`<div class="message-header"></div>`).append(
			createUserTag(message.author.username, message.author.color),
			timestampEle,
		),
		dom(`<div class="message-content"></div>`).append(
			dom(`<div class="message-body"></div>`).text(message.content),
			dom(`<div class="message-attachments"></div>`).append(...attachments),
		),
	).element;
}

function createAttachment(attachment) {
	let slashIndex = attachment.lastIndexOf("/");
	let fileName = attachment.substring(slashIndex + 1);

	return dom(`<a class="file-chip"></a>`)
		.prop("href", `${client.baseUrl.http}/${attachment}`)
		.text(fileName);
}
