// @ts-ignore
import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";

export type BackFunction = (() => void) | null;

export interface ViewWrapper {
	header: HTMLElement;
	content: HTMLElement;
	footer: HTMLElement;
	backAction: BackFunction;
}

const $backContainer = dom("#app > .head > .back-container");
const $backBtn = $backContainer.find(".back-btn");
const $header = dom("#app > .head > .header");
const $content = dom("#app > .content");
const $footer = dom("#app > .footer");

let backAction: BackFunction = null;

// Initialize default view wrappers
const viewWrappers = new Map<string, ViewWrapper>();

// Add back button handler
$backBtn.on("click", () => {
	if (typeof backAction === "function") backAction();
});

export function getView(name: string): ViewWrapper | undefined {
	return viewWrappers.get(name);
}

export function setView(name: string, wrapper: ViewWrapper): void {
	viewWrappers.set(name, wrapper);
}

export function createBlankView(): ViewWrapper {
	return {
		header: dom(`<div class="header"></div>`).element,
		content: dom(`<div class="content"></div>`).element,
		footer: dom(`<div class="footer"></div>`).element,
		backAction: null,
	};
}

/** Change the view to the given wrapper */
export function switchView(view: ViewWrapper) {
	$header.replaceWith(view.header);
	$content.replaceWith(view.content);
	$footer.replaceWith(view.footer);

	// Update back action
	if (typeof view.backAction === "function") {
		$backContainer.removeClass("hidden");
	} else {
		$backContainer.addClass("hidden");
	}
	backAction = view.backAction;
}
