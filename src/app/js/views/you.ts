// @ts-ignore
import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";
import { getView, setView, type ViewWrapper } from "../views.ts";

export function getYouView(): ViewWrapper {
	// Return existing view
	const existingView = getView("you");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(`<div class="header">
			<span class="title">You</span>
			<div class="flex-spacer"></div>
		</div>`)
			.append(
				dom(`<div id="logout-btn" class="ic-small-container">
					<span class="ic-small ic-right-arrow-bracket"></span>
				</div>`).on("click", () => {
					location.href = "/login/";
				}),
			)
			.append(
				dom(`<div id="settings-btn" class="ic-small-container">
					<span class="ic-small ic-gear"></span>
				</div>`),
			).element,
		content: dom(`<div class="content"></div>`).element,
		footer: dom(`<div class="footer hidden"></div>`).element,
		backAction: null,
	};

	// Save and return the view
	setView("you", view);

	return view;
}
