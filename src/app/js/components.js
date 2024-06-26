import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";

export function createRoomTab(name) {
	return dom(`<div class="channel-tab"></div>`)
		.prop("data-channel-id", name) // NOTE: is name is not always going to be the id
		.append(
			`<span class="ic-text-size ic-hashtag"></span>`,
			dom(`<span name="channel-name"></span>`).text(name)
		).element;
}

export function createUserTag(name, color) {
	return dom(`<span class="user-tag"></span>`)
		.text(name)
		.style("color", color).element;
}

export function createUserChip(name, color, online = true) {
	let tagEle = createUserTag(name, color);

	if (!online) tagEle.classList.add("offline");

	return dom(`<div class="user-chip"></div>`).append(
		`<span class="ic-text-size ic-${
			online ? "green" : "gray"
		}-dot"></span>`,
		tagEle
	);
}

export function createMessage(message) {
	// Create timestamp element with tippy
	let timestampEle = dom(`<span class="message-timestamp"></span>`).text(
		moment(message.timestamp).format("LT")
	).element;

	tippy(timestampEle, {
		content: moment(message.timestamp).format("LLLL")
	});

	// Return full component
	return dom(`<div class="message"></div>`).append(
		dom(`<div class="message-header"></div>`).append(
			createUserTag(message.author.username, message.author.color),
			timestampEle
		),
		dom(`<div class="message-content"></div>`).append(
			dom(`<div class="message-body"></div>`).text(message.content),
			dom(`<div class="message-attachments"></div>`)
		)
	).element;
}
