import { dom, html } from "@debutter/dough";
import { getView, setView, switchView, type ViewWrapper } from "../views.ts";
import { switchNav } from "../navigator.ts";
import { appendBreadcrumb } from "../breadcrumbs.ts";

export function getExploreView(): ViewWrapper {
	// Return existing view
	const existingView = getView("explore");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(
			html`<div class="header">
				<div class="left"></div>

				<div class="center">
					<span class="title">Explore</span>
				</div>

				<div class="right">
					<div class="ic-small-container">
						<span class="ic-small ic-magnifying-glass"></span>
					</div>
				</div>
			</div>`
		),
		content: dom(html`<div class="content"></div>`),
		footer: dom(html`<div class="footer hidden"></div>`),
		switchAction: () => {
			// Update navigation
			switchNav("explore");

			// Append breadcrumb
			appendBreadcrumb(
				"Explore",
				() => {
					switchView(getExploreView());
				},
				"Home"
			);
		}
	};

	// Save and return the view
	setView("explore", view);

	return view;
}
