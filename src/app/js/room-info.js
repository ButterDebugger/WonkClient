import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { getOrCreateWrapper, getWrapper, hasWrapper } from "./wrapper.js";
import { changeViewDrawer, switchDrawer } from "./ui.js";
import { leaveRoom } from "./main.js";

export function getOrCreateRoomInfoWrapper(room) {
	let roomKey = `#${room.name}`;
	let infoKey = `i#${room.name}`;
	if (hasWrapper(infoKey)) return getWrapper(infoKey);

	let wrapper = getOrCreateWrapper(infoKey);

	wrapper.footer.classList.add("hidden");
	wrapper.backAction = function () {
		switchDrawer("view");

		// Change view drawer to room
		let wrapper = getWrapper(roomKey);
		changeViewDrawer(wrapper);
	};

	// Add leave room button
	dom(wrapper.content).append(
		dom(`<button>Leave</button>`).on("click", async () => {
			let success = await leaveRoom(room.name);

			if (success) {
				switchDrawer("rooms");
			} else {
				console.error("Failed to leave room"); // TODO: make fancier
			}
		})
	);

	return wrapper;
}

export function updateMemberJoin(userId, roomName, timestamp) {}

export function updateMemberLeave(userId, roomName, timestamp) {}
