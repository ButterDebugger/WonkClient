import { dom, html } from "@debutter/dough";
import { getView, setView, switchView, type ViewWrapper } from "../views.ts";
import { switchNav } from "../navigator.ts";
import { appendBreadcrumb } from "../breadcrumbs.ts";

export function getChatsView(): ViewWrapper {
	// Return existing view
	const existingView = getView("chats");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(
			html`<div class="header">
				<div class="center">
					<span class="title">Chats</span>
				</div>

				<div class="right">
					<div class="ic-small-container">
						<span
							id="start-convo-btn"
							class="ic-small ic-plus"
						></span>
					</div>
				</div>
			</div>`
		),
		content: dom(
			html`<div class="content no-select">
				<div class="channel-tab">
					<span class="ic-text-size ic-at"></span>
					<span>Debutter</span>
				</div>
				<div class="channel-tab">
					<span class="ic-text-size ic-at"></span>
					<span>Sloth</span>
				</div>
				<div class="channel-tab">
					<span class="ic-text-size ic-at"></span>
					<span>Applesauce</span>
				</div>
			</div>`
		),
		footer: dom(html`<div class="footer hidden"></div>`),
		switchAction: () => {
			// Update navigation
			switchNav("chats");

			// Append breadcrumb
			appendBreadcrumb(
				"Chats",
				() => {
					switchView(getChatsView());
				},
				"Home"
			);
		}
	};

	// Save and return the view
	setView("chats", view);

	return view;
}
