import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { createRoomTab } from "./components.js";
import { client, joinOrCreateRoom } from "./main.js";
import { hideModal, showModal } from "./modal.js";
import { getOrCreateRoomWrapper } from "./room.js";

const exploreDrawer = document.getElementById("explore-drawer");
const roomsDrawer = document.getElementById("rooms-drawer");
const messagesDrawer = document.getElementById("messages-drawer");
const youDrawer = document.getElementById("you-drawer");
const viewDrawer = document.getElementById("view-wrapper");

const navbarEle = document.getElementById("navbar");
const navExploreBtn = document.getElementById("nav-explore");
const navRoomsBtn = document.getElementById("nav-rooms");
const navMessagesBtn = document.getElementById("nav-messages");
const navYouBtn = document.getElementById("nav-you");

const logoutBtn = document.getElementById("logout-btn");
const joinRoomBtn = document.getElementById("join-room-btn");

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
	let $container = dom(`<div class="container join-room"></div>`);
	let $input = dom(
		`<input type="text" placeholder="Name" required minlength="3">`
	);
	let $joinBtn = dom(`<button disabled>Join</button>`);

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
	viewDrawer.querySelector(".header").replaceWith(wrapper.header);
	viewDrawer.querySelector(".content").replaceWith(wrapper.content);
	viewDrawer.querySelector(".footer").replaceWith(wrapper.footer);

	if (wrapper.backAction !== null)
		viewDrawer
			.querySelector("#back-btn")
			.addEventListener("click", () => wrapper.backAction());
}

export function updateRoomTabs() {
	let roomsContainer = roomsDrawer.querySelector(".content");
	let oldTabs = Array.from(roomsContainer.querySelectorAll(".channel-tab"));

	for (let room of client.rooms.cache.values()) {
		let ele = createRoomTab(room.name);
		getOrCreateRoomWrapper(room);

		// Remove room tab from list of old tabs
		oldTabs = oldTabs.filter(
			(tab) => tab.getAttribute("data-channel-id") != room.name
		);

		ele.addEventListener("click", () => {
			switchDrawer("view");

			let wrapper = getOrCreateRoomWrapper(room);
			changeViewDrawer(wrapper);

			// Scroll to the bottom
			wrapper.content.scrollTop = wrapper.content.scrollHeight;
		});

		roomsContainer.appendChild(ele);
	}

	// Remove any remaining old tabs
	for (let tab of oldTabs) {
		tab.remove();
	}
}
