import { dom, html, type DomContext } from "@debutter/dom";

export type BackFunction = (() => void) | null;

export interface ViewWrapper {
	header: DomContext;
	content: DomContext;
	footer: DomContext;
	backAction: BackFunction;
}

const $backContainer = <DomContext>dom("#app > .head > .back-container");
const $backBtn = <DomContext>$backContainer.find(".back-btn");
const $header = <DomContext>dom("#app > .head > .header");
const $content = <DomContext>dom("#app > .content");
const $footer = <DomContext>dom("#app > .footer");

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
		header: dom(html`<div class="header"></div>`),
		content: dom(html`<div class="content"></div>`),
		footer: dom(html`<div class="footer"></div>`),
		backAction: null
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
