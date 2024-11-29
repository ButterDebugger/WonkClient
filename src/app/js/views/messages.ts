import { dom, parseHTML } from "@debutter/dom";
import { getView, setView, type ViewWrapper } from "../views.ts";

export function getMessagesView(): ViewWrapper {
	// Return existing view
	const existingView = getView("messages");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(
			parseHTML(
				`<div class="header">
					<span class="title">Messages</span>
					<div class="flex-spacer"></div>
					<div class="ic-small-container">
						<span
							id="start-convo-btn"
							class="ic-small ic-plus"
						></span>
					</div>
				</div>`,
			),
		),
		content: dom(
			parseHTML(
				`<div class="content no-select">
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
				</div>`,
			),
		),
		footer: dom(parseHTML(`<div class="footer hidden"></div>`)),
		backAction: null,
	};

	// Save and return the view
	setView("messages", view);

	return view;
}
