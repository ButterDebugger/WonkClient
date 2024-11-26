import { switchView } from "./views.ts";
import { getRoomsView } from "./views/rooms.ts";
import { getExploreView } from "./views/explore.ts";
import { getMessagesView } from "./views/messages.ts";
import { getYouView } from "./views/you.ts";

const navExploreBtn = <HTMLElement>document.getElementById("nav-explore");
const navRoomsBtn = <HTMLElement>document.getElementById("nav-rooms");
const navMessagesBtn = <HTMLElement>document.getElementById("nav-messages");
const navYouBtn = <HTMLElement>document.getElementById("nav-you");

// Show default view
switchView(getExploreView());

// Add navbar view switch handlers
navExploreBtn.addEventListener("click", () => {
	switchView(getExploreView());
	switchNav("explore");
});
navRoomsBtn.addEventListener("click", () => {
	switchView(getRoomsView());
	switchNav("rooms");
});
navMessagesBtn.addEventListener("click", () => {
	switchView(getMessagesView());
	switchNav("messages");
});
navYouBtn.addEventListener("click", () => {
	switchView(getYouView());
	switchNav("you");
});

export function switchNav(
	drawerName: "messages" | "rooms" | "explore" | "you",
) {
	const addOrRemove = (name: string) =>
		drawerName === name ? "add" : "remove";

	navMessagesBtn.classList[addOrRemove("messages")]("active");
	navRoomsBtn.classList[addOrRemove("rooms")]("active");
	navExploreBtn.classList[addOrRemove("explore")]("active");
	navYouBtn.classList[addOrRemove("you")]("active");
}
