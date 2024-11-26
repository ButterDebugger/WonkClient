// @ts-ignore
import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { getView, setView, type ViewWrapper } from "../views.ts";

export function getMessagesView(): ViewWrapper {
	// Return existing view
	const existingView = getView("messages");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(`<div class="header">
				<span class="title">Messages</span>
				<div class="flex-spacer"></div>
				<div class="ic-small-container">
					<span
						id="start-convo-btn"
						class="ic-small ic-plus"
					></span>
				</div>
			</div>`).element,
		content: dom(`<div class="content no-select">
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
		</div>`).element,
		footer: dom(`<div class="footer hidden"></div>`).element,
		backAction: null,
	};

	// Save and return the view
	setView("messages", view);

	return view;
}
