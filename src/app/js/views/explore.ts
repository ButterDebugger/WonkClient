import { dom, html } from "@debutter/dom";
import { getView, setView, type ViewWrapper } from "../views.ts";

export function getExploreView(): ViewWrapper {
	// Return existing view
	const existingView = getView("explore");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(
			html`<div class="header">
				<span class="title">Explore</span>
				<div class="flex-spacer"></div>

				<div id="start-search-btn" class="ic-small-container">
					<span class="ic-small ic-magnifying-glass"></span>
				</div>
			</div>`
		),
		content: dom(html`<div class="content"></div>`),
		footer: dom(html`<div class="footer hidden"></div>`),
		backAction: null
	};

	// Save and return the view
	setView("explore", view);

	return view;
}
