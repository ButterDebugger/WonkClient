import { dom, html } from "@debutter/dom";
import { getView, setView, switchView, type ViewWrapper } from "../views.ts";
import { switchNav } from "../navigator.ts";
import { appendBreadcrumb } from "../breadcrumbs.ts";

export function getYouView(): ViewWrapper {
	// Return existing view
	const existingView = getView("you");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(
			html`<div class="header">
				<div class="center">
					<span class="title">You</span>
				</div>

				<div class="right">
					<div
						id="logout-btn"
						class="ic-small-container"
						onclick=${() => {
							location.href = "/login/";
						}}
					>
						<span class="ic-small ic-right-arrow-bracket"></span>
					</div>

					<div id="settings-btn" class="ic-small-container">
						<span class="ic-small ic-gear"></span>
					</div>
				</div>
			</div>`
		),
		content: dom(html`<div class="content"></div>`),
		footer: dom(html`<div class="footer hidden"></div>`),
		switchAction: () => {
			// Update navigation
			switchNav("you");

			// Append breadcrumb
			appendBreadcrumb(
				"You",
				() => {
					switchView(getYouView());
				},
				"Home"
			);
		}
	};

	// Save and return the view
	setView("you", view);

	return view;
}
