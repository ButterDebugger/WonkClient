// @ts-ignore
import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { createRoomTab } from "./components.js";
import { client, joinOrCreateRoom } from "./main.js";
import { hideModal, showModal } from "./modal.js";
import { getOrCreateRoomWrapper } from "./room.js";

const exploreDrawer = <HTMLElement>document.getElementById("explore-drawer");
const roomsDrawer = <HTMLElement>document.getElementById("rooms-drawer");
const messagesDrawer = <HTMLElement>document.getElementById("messages-drawer");
const youDrawer = <HTMLElement>document.getElementById("you-drawer");
const viewDrawer = <HTMLElement>document.getElementById("view-wrapper");

const navbarEle = <HTMLElement>document.getElementById("navbar");
const navExploreBtn = <HTMLElement>document.getElementById("nav-explore");
const navRoomsBtn = <HTMLElement>document.getElementById("nav-rooms");
const navMessagesBtn = <HTMLElement>document.getElementById("nav-messages");
const navYouBtn = <HTMLElement>document.getElementById("nav-you");

const logoutBtn = <HTMLElement>document.getElementById("logout-btn");
const joinRoomBtn = <HTMLElement>document.getElementById("join-room-btn");

navExploreBtn.addEventListener("click", () => {
	switchDrawer("explore");
});
navRoomsBtn.addEventListener("click", () => {
	switchDrawer("rooms");
});
navMessagesBtn.addEventListener("click", () => {
	switchDrawer("messages");
});
navYouBtn.addEventListener("click", () => {
	switchDrawer("you");
});

logoutBtn.addEventListener("click", () => {
	location.href = "/login/";
});

joinRoomBtn.addEventListener("click", () => {
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
});

export function switchDrawer(drawerName) {
	const removeOrAdd = (name) => (drawerName === name ? "remove" : "add");
	const addOrRemove = (name) => (drawerName === name ? "add" : "remove");

	// Show / hide drawers
	messagesDrawer.classList[removeOrAdd("messages")]("hidden");
	roomsDrawer.classList[removeOrAdd("rooms")]("hidden");
	exploreDrawer.classList[removeOrAdd("explore")]("hidden");
	youDrawer.classList[removeOrAdd("you")]("hidden");
	viewDrawer.classList[removeOrAdd("view")]("hidden");

	// Only change the active button if a it can be switched
	if (["messages", "rooms", "explore", "you"].includes(drawerName)) {
		navMessagesBtn.classList[addOrRemove("messages")]("active");
		navRoomsBtn.classList[addOrRemove("rooms")]("active");
		navExploreBtn.classList[addOrRemove("explore")]("active");
		navYouBtn.classList[addOrRemove("you")]("active");
	}
}

export function changeViewDrawer(wrapper) {
	// Change view drawer
	const headerEle = <HTMLElement>viewDrawer.querySelector(".header");
	const contentEle = <HTMLElement>viewDrawer.querySelector(".content");
	const footerEle = <HTMLElement>viewDrawer.querySelector(".footer");

	headerEle.replaceWith(wrapper.header);
	contentEle.replaceWith(wrapper.content);
	footerEle.replaceWith(wrapper.footer);

	if (wrapper.backAction !== null) {
		const backBtn = <HTMLElement>viewDrawer.querySelector("#back-btn");

		backBtn.addEventListener("click", () => wrapper.backAction());
	}
}

export function updateRoomTabs() {
	const roomsContainer = <HTMLElement>roomsDrawer.querySelector(".content");
	let oldTabs = Array.from(roomsContainer.querySelectorAll(".channel-tab"));

	for (const room of client.rooms.cache.values()) {
		const ele = createRoomTab(room.name);
		getOrCreateRoomWrapper(room);

		// Remove room tab from list of old tabs
		oldTabs = oldTabs.filter(
			(tab) => tab.getAttribute("data-channel-id") !== room.name,
		);

		ele.addEventListener("click", () => {
			switchDrawer("view");

			const wrapper = getOrCreateRoomWrapper(room);
			changeViewDrawer(wrapper);

			// Scroll to the bottom
			wrapper.content.scrollTop = wrapper.content.scrollHeight;
		});

		roomsContainer.appendChild(ele);
	}

	// Remove any remaining old tabs
	for (const tab of oldTabs) {
		tab.remove();
	}
}
