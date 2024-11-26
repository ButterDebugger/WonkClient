// @ts-ignore
import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { getView, setView, type ViewWrapper } from "../views.ts";

export function getExploreView(): ViewWrapper {
	// Return existing view
	const existingView = getView("explore");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(`<div class="header">
			<span class="title">Explore</span>
				<div class="flex-spacer"></div>

				<div id="start-search-btn" class="ic-small-container">
					<span class="ic-small ic-magnifying-glass"></span>
				</div>
			</div>`).element,
		content: dom(`<div class="content"></div>`).element,
		footer: dom(`<div class="footer hidden"></div>`).element,
		backAction: null,
	};

	// Save and return the view
	setView("explore", view);

	return view;
}
