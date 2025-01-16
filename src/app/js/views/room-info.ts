import { dom, html } from "@debutter/dom";
import { switchNav } from "../navigator.ts";
import { leaveRoom } from "../main.ts";
import { createUserChip } from "../components.ts";
import type { Room } from "../../../lib/roomManager.ts";
import {
	createBlankView,
	getView,
	setView,
	switchView,
	type ViewWrapper
} from "../views.ts";

export function getOrCreateRoomInfoView(room: Room): ViewWrapper {
	// Return existing view
	const roomKey = `#${room.name}`;
	const infoKey = `i#${room.name}`;

	const existingView = getView(infoKey);
	if (existingView) return existingView;

	// Create new view
	const view = createBlankView();

	view.header.addClass("room-info");
	view.content.addClass("room-info");
	view.footer.addClass("hidden");
	view.backAction = () => {
		const view = getView(roomKey);
		if (!view) return;

		switchView(view);
	};

	// Add members list and update handlers
	const $membersList = dom(html`<div class="members-list"></div>`);

	// TODO: make a loading screen until this finishes
	for (const member of room.members) {
		room.client.users.fetch(member).then((user) => {
			const ele = createUserChip(user.username, user.color, user.online);

			$membersList.append(ele); // TODO: add members in alphabetical order and by statuses
		});
	}

	room.client.on("roomMemberJoin", (username, roomName) => {
		if (room.name !== roomName) return;

		// TODO: dynamically add user to members list
	});
	room.client.on("roomMemberLeave", (username, roomName) => {
		if (room.name !== roomName) return;

		// TODO: remove user from the members list
	});

	// Add header tab buttons
	function switchInfoTab(name: string) {
		view.header.findAll(".tab").removeClass("active");
		view.header.find(`[for="${name}"]`)?.addClass("active");

		view.content.findAll(".info-container").addClass("hidden");
		view.content.find(`[for="${name}"]`)?.removeClass("hidden");
	}

	dom(view.header).append(
		dom(
			html`<div class="tab no-select active" for="general">
				<span class="ic-small ic-gear"></span>
				<span class="tab-name">General</span>
			</div>`
		).on("click", () => switchInfoTab("general")),
		dom(
			html`<div class="tab no-select" for="members">
				<span class="ic-small ic-user"></span>
				<span class="tab-name">Members</span>
			</div>`
		).on("click", () => switchInfoTab("members"))
	);

	// Add tab sections
	dom(view.content).append(
		// Add general settings area
		dom(html`<div class="info-container" for="general"></div>`).append(
			dom(html`<button>Leave</button>`).on("click", async () => {
				const success = await leaveRoom(room.name);

				if (success) {
					switchNav("rooms");
				} else {
					console.error("Failed to leave room"); // TODO: make fancier
				}
			})
		),
		// Add members area
		dom(
			html`<div class="info-container hidden" for="members"></div>`
		).append($membersList)
	);

	// Save and return the view
	setView(infoKey, view);

	return view;
}
