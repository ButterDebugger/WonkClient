import { switchView } from "./views.ts";
import { getRoomsView } from "./views/rooms.ts";
import { getExploreView } from "./views/explore.ts";
import { getMessagesView } from "./views/messages.ts";
import { getYouView } from "./views/you.ts";
import { appendBreadcrumb } from "./breadcrumbs.ts";

const navExploreBtn = <HTMLElement>document.getElementById("nav-explore");
const navRoomsBtn = <HTMLElement>document.getElementById("nav-rooms");
const navMessagesBtn = <HTMLElement>document.getElementById("nav-messages");
const navYouBtn = <HTMLElement>document.getElementById("nav-you");

// Set the default breadcrumbs
appendBreadcrumb("Home", () => {
	location.reload();
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
navMessagesBtn.addEventListener("click", () => {
	// Switch to the messages view
	switchView(getMessagesView());

	// Add breadcrumb
	appendBreadcrumb(
		"Messages",
		() => {
			switchView(getMessagesView());
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

export function switchNav(
	drawerName: "messages" | "rooms" | "explore" | "you"
) {
	const addOrRemove = (name: string) =>
		drawerName === name ? "add" : "remove";

	navMessagesBtn.classList[addOrRemove("messages")]("active");
	navRoomsBtn.classList[addOrRemove("rooms")]("active");
	navExploreBtn.classList[addOrRemove("explore")]("active");
	navYouBtn.classList[addOrRemove("you")]("active");
}
