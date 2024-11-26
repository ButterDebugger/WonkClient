// @ts-ignore
import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { getView, setView, switchView, type ViewWrapper } from "../views.ts";
import { hideModal, showModal } from "../modal.ts";
import { client, joinOrCreateRoom } from "../main.ts";
import { createRoomTab } from "../components.ts";
import { getOrCreateRoomView } from "./room.ts";

export function getRoomsView(): ViewWrapper {
	// Return existing view
	const existingView = getView("rooms");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(`<div class="header">
            <span class="title">Rooms</span>
            <div class="flex-spacer"></div>
        </div>`).append(
			dom(`<div id="join-room-btn" class="ic-small-container">
                <span class="ic-small ic-plus"></span>
            </div>`).on("click", () => {
				const $container = dom(`<div class="container flex-row"></div>`);
				const $input = dom(
					`<input type="text" placeholder="Name" required minlength="3">`,
				);
				const $joinBtn = dom("<button disabled>Join</button>");

				$input.on("input", () => {
					if ($input.element.validity.valid) {
						$joinBtn.prop("disabled", false);
					} else {
						$joinBtn.prop("disabled", true);
					}
				});

				$container.append($input, $joinBtn);

				$joinBtn.on("click", async () => {
					$joinBtn.prop("disabled", true);

					if (await joinOrCreateRoom($input.prop("value"))) {
						hideModal();
					}

					$joinBtn.prop("disabled", false);
				});

				showModal("Join Room", $container);
			}),
		).element,
		content: dom(`<div class="content"></div>`).element,
		footer: dom(`<div class="footer hidden"></div>`).element,
		backAction: null,
	};

	// Save and return the view
	setView("rooms", view);

	return view;
}

export function updateRoomsTabs() {
	const view = getRoomsView();
	const roomsContainer = view.content;
	let oldTabs = Array.from(roomsContainer.querySelectorAll(".channel-tab"));

	for (const room of client.rooms.cache.values()) {
		const ele = createRoomTab(room.name);
		getOrCreateRoomView(room);

		// Remove room tab from list of old tabs
		oldTabs = oldTabs.filter(
			(tab) => tab.getAttribute("data-channel-id") !== room.name,
		);

		ele.addEventListener("click", () => {
			const view = getOrCreateRoomView(room);
			switchView(view);

			// Scroll to the bottom
			view.content.scrollTop = view.content.scrollHeight;
		});

		roomsContainer.appendChild(ele);
	}

	// Remove any remaining old tabs
	for (const tab of oldTabs) {
		tab.remove();
	}
}
