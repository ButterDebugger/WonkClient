import { switchView } from "./views.ts";
import { getRoomsView } from "./views/rooms.ts";
import { getExploreView } from "./views/explore.ts";
import { getChatsView } from "./views/chats.ts";
import { getYouView } from "./views/you.ts";
import { appendBreadcrumb } from "./breadcrumbs.ts";

const navExploreBtn = <HTMLElement>document.getElementById("nav-explore");
const navRoomsBtn = <HTMLElement>document.getElementById("nav-rooms");
const navChatsBtn = <HTMLElement>document.getElementById("nav-chats");
const navYouBtn = <HTMLElement>document.getElementById("nav-you");

// Set the default breadcrumbs
appendBreadcrumb("Home", () => {
	location.href = "/";
});

// Show default view
switchView(getExploreView());

// Add navbar view switch handlers
navExploreBtn.addEventListener("click", () => {
	// Switch to the explore view
	switchView(getExploreView());

	// Add breadcrumb
	appendBreadcrumb(
		"Explore",
		() => {
			switchView(getExploreView());
		},
		"Home"
	);
});
navRoomsBtn.addEventListener("click", () => {
	// Switch to the rooms view
	switchView(getRoomsView());

	// Add breadcrumb
	appendBreadcrumb(
		"Rooms",
		() => {
			switchView(getRoomsView());
		},
		"Home"
	);
});
navChatsBtn.addEventListener("click", () => {
	// Switch to the chats view
	switchView(getChatsView());

	// Add breadcrumb
	appendBreadcrumb(
		"Chats",
		() => {
			switchView(getChatsView());
		},
		"Home"
	);
});
navYouBtn.addEventListener("click", () => {
	// Switch to the you view
	switchView(getYouView());

	// Add breadcrumb
	appendBreadcrumb(
		"You",
		() => {
			switchView(getYouView());
		},
		"Home"
	);
});

export function switchNav(drawerName: "chats" | "rooms" | "explore" | "you") {
	const addOrRemove = (name: string) =>
		drawerName === name ? "add" : "remove";

	navChatsBtn.classList[addOrRemove("chats")]("active");
	navRoomsBtn.classList[addOrRemove("rooms")]("active");
	navExploreBtn.classList[addOrRemove("explore")]("active");
	navYouBtn.classList[addOrRemove("you")]("active");
}
