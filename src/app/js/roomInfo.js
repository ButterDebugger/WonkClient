import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { getOrCreateWrapper, getWrapper, hasWrapper } from "./wrapper.js";
import { changeViewDrawer, switchDrawer } from "./ui.js";
import { leaveRoom } from "./main.js";
import { createUserChip } from "./components.js";

export function getOrCreateRoomInfoWrapper(room) {
	let roomKey = `#${room.name}`;
	let infoKey = `i#${room.name}`;
	if (hasWrapper(infoKey)) return getWrapper(infoKey);

	let wrapper = getOrCreateWrapper(infoKey);

	wrapper.header.classList.add("room-info");
	wrapper.content.classList.add("room-info");
	wrapper.footer.classList.add("hidden");
	wrapper.backAction = function () {
		switchDrawer("view");

		// Change view drawer to room
		let wrapper = getWrapper(roomKey);
		changeViewDrawer(wrapper);
	};

	// Add members list and update handlers
	let $membersList = dom(`<div class="members-list"></div>`);

	// TODO: make a loading screen until this finishes
	for (let member of room.members) {
		room.client.users.fetch(member).then((user) => {
			let ele = createUserChip(user.username, user.color, user.online);

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
	function switchInfoTab(name) {
		dom(wrapper.header).findAll(".tab").removeClass("active");
		dom(wrapper.header).find(`[for="${name}"]`).addClass("active");

		dom(wrapper.content).findAll(".info-container").addClass("hidden");
		dom(wrapper.content).find(`[for="${name}"]`).removeClass("hidden");
	}

	dom(wrapper.header).append(
		dom(
			`<div class="tab no-select active" for="general">
				<span class="ic-small ic-gear"></span>
				<span class="tab-name">General</span>
			</div>`
		).on("click", () => switchInfoTab("general")),
		dom(
			`<div class="tab no-select" for="members">
				<span class="ic-small ic-user"></span>
				<span class="tab-name">Members</span>
			</div>`
		).on("click", () => switchInfoTab("members"))
	);

	// Add tab sections
	dom(wrapper.content).append(
		// Add general settings area
		dom(`<div class="info-container" for="general"></div>`).append(
			dom(`<button>Leave</button>`).on("click", async () => {
				let success = await leaveRoom(room.name);

				if (success) {
					switchDrawer("rooms");
				} else {
					console.error("Failed to leave room"); // TODO: make fancier
				}
			})
		),
		// Add members area
		dom(`<div class="info-container hidden" for="members"></div>`).append(
			$membersList
		)
	);

	return wrapper;
}
