import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { createMessage } from "../components.js";
import { changeViewDrawer, switchDrawer } from "../ui.js";
import { sendMessage } from "../main.js";
import { hasWrapper, getOrCreateWrapper, getWrapper } from "./wrapper.js";
import { getOrCreateRoomInfoWrapper } from "./room-info.js";

export function getOrCreateRoomWrapper(room) {
	let roomKey = `#${room.name}`;
	if (hasWrapper(roomKey)) return getWrapper(roomKey);

	let wrapper = getOrCreateWrapper(roomKey);

	wrapper.header.classList.add("room");
	wrapper.content.classList.add("room");
	wrapper.footer.classList.add("room");
	wrapper.doubled = true;

	// Create message input field
	let $messageInput = dom(
		`<input type="text" name="message-input" maxlength="1000">`
	)
		.on("keydown", ({ key }) => {
			if (key === "Enter") send();
		})
		.prop("placeholder", `Message #${room.name}`);

	// Add send message handlers
	async function send() {
		let value = $messageInput.prop("value");
		$messageInput.prop("value", "");

		if (value.length === 0) return;

		let result = await sendMessage(room.name, {
			text: value
		});

		if (!result) {
			alert("Failed to send message"); // TODO: make fancier
		}
	}

	// Append footer message box
	dom(wrapper.footer).append(
		// Add attach icon to wrapper footer
		dom(
			`<div class="ic-normal-container">
				<span name="attach-button" class="ic-raw ic-normal ic-plus"></span>
			</div>`
		),

		// Add message input
		$messageInput,

		// Add send icon to wrapper footer
		dom(
			`<div class="ic-normal-container">
                <span name="send-button" class="ic-raw ic-normal ic-arrow-up"></span>
            </div>`
		).on("click", () => send())
	);

	// Append header content
	dom(wrapper.header).append(
		// Append back icon to wrapper header
		dom(
			`<div class="ic-small-container">
				<span class="ic-raw ic-small ic-chevron-left"></span>
			</div>`
		).on("click", () => switchDrawer("rooms")),

		// Append room label to wrapper header
		dom(`<div class="label"></div>`).append(
			dom(`<span class="title"></span>`).text(room.name),
			dom(`<span class="description"></span>`).text(room.description)
		),

		// Append flex spacer
		`<div class="flex-spacer"></div>`,

		// Append more icon to wrapper header
		dom(
			`<div class="ic-small-container">
				<span class="ic-raw ic-small ic-ellipsis"></span>
			</div>`
		).on("click", () => {
			switchDrawer("view");
			changeViewDrawer(getOrCreateRoomInfoWrapper(room));
		})
	);

	return wrapper;
}

export function appendMessage(message) {
	let wrapper = getOrCreateWrapper(`#${message.room.name}`);
	let canScroll =
		wrapper.content.scrollHeight - Math.ceil(wrapper.content.scrollTop) <=
		wrapper.content.clientHeight;
	let messageEle = createMessage(message);
	wrapper.content.appendChild(messageEle);

	if (canScroll) {
		wrapper.content.style["scroll-behavior"] = "unset";
		messageEle.scrollIntoView();
		wrapper.content.style["scroll-behavior"] = "";
	}
}
