import { dom, parseHTML } from "@debutter/dom";
import { getView, setView, type ViewWrapper } from "../views.ts";

export function getYouView(): ViewWrapper {
	// Return existing view
	const existingView = getView("you");
	if (existingView) return existingView;

	// Create new view
	const view: ViewWrapper = {
		header: dom(
			parseHTML(
				`<div class="header">
					<span class="title">You</span>
					<div class="flex-spacer"></div>
				</div>`,
			),
		)
			.append(
				dom(
					parseHTML(
						`<div id="logout-btn" class="ic-small-container">
							<span class="ic-small ic-right-arrow-bracket"></span>
						</div>`,
					),
				).on("click", () => {
					location.href = "/login/";
				}),
			)
			.append(
				dom(
					parseHTML(
						`<div id="settings-btn" class="ic-small-container">
							<span class="ic-small ic-gear"></span>
						</div>`,
					),
				),
			),
		content: dom(parseHTML(`<div class="content"></div>`)),
		footer: dom(parseHTML(`<div class="footer hidden"></div>`)),
		backAction: null,
	};

	// Save and return the view
	setView("you", view);

	return view;
}
