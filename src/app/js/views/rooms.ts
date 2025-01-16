import { dom, type DomContext, html } from "@debutter/dom";
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
		header: dom(
			html`<div class="header">
				<span class="title">Rooms</span>
				<div class="flex-spacer"></div>
			</div>`
		).append(
			dom(
				html`<div id="join-room-btn" class="ic-small-container">
					<span class="ic-small ic-plus"></span>
				</div>`
			).on("click", () => {
				const $container = dom(
					html`<div class="container flex-row"></div>`
				);
				const $input = dom(
					html`<input
						type="text"
						placeholder="Name"
						required
						minlength="3"
					/>`
				);
				const inputEle = <HTMLInputElement>$input.element;
				const $joinBtn = dom(html`<button disabled>Join</button>`);

				$input.on("input", () => {
					if (inputEle.validity.valid) {
						$joinBtn.prop("disabled", false);
					} else {
						$joinBtn.prop("disabled", true);
					}
				});

				$container.append($input, $joinBtn);

				$joinBtn.on("click", async () => {
					$joinBtn.prop("disabled", true);

					if (await joinOrCreateRoom(<string>$input.prop("value"))) {
						hideModal();
					}

					$joinBtn.prop("disabled", false);
				});

				showModal("Join Room", $container);
			})
		),
		content: dom(html`<div class="content"></div>`),
		footer: dom(html`<div class="footer hidden"></div>`),
		backAction: null
	};

	// Save and return the view
	setView("rooms", view);

	return view;
}

export function updateRoomsTabs() {
	const view = getRoomsView();
	const $roomsContainer = view.content;
	let $oldTabs: DomContext[] = [...$roomsContainer.findAll(".channel-tab")];

	for (const room of client.rooms.cache.values()) {
		const $ele = createRoomTab(room.name);
		getOrCreateRoomView(room);

		// Remove room tab from list of old tabs
		$oldTabs = $oldTabs.filter(
			(tab) => tab.attr("data-channel-id") !== room.name
		);

		$ele.on("click", () => {
			const view = getOrCreateRoomView(room);
			switchView(view);

			// Scroll to the bottom
			view.content.element.scrollTop = view.content.element.scrollHeight;
		});

		$roomsContainer.append($ele);
	}

	// Remove any remaining old tabs
	for (const tab of $oldTabs) {
		tab.remove();
	}
}
