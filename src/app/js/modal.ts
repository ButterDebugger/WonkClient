import { $, dom, type DomContext, html } from "@debutter/dough";

const $background = dom(html`<div id="modal-background" class="hidden"></div>`);
const modalQueue: Modal[] = [];
let isModalUnlocked = true; // TODO: provide some indicator that the modal is locked

$(document.body).append($background);

interface Modal {
	title: string;
	content: DomContext;
}

export function showModal(title: string, content: DomContext) {
	if (isModalPresent()) {
		modalQueue.push({
			title,
			content
		});
		return;
	}

	// Play background animation
	dom("#root")?.addClass("modal-present");

	$background.removeClass("hidden");

	if (!$background.hasClass("increase-opacity"))
		setTimeout(() => {
			$background.addClass("increase-opacity");
		}, 1);

	// Create and append the modal to the body
	const $modal = dom(
		html`<div id="modal-wrapper">
			<div class="header">
				<span class="title">Modal</span>
			</div>
			<div class="content"></div>
		</div>`
	);

	$modal.find(".title")?.text(title);

	$modal.find(".header")?.append(
		html`<div
			class="ic-small-container"
			onclick=${() => {
				if (isModalUnlocked) {
					hideModal();
				}
			}}
		>
			<span class="ic-small ic-xmark"></span>
		</div>`
	);

	$modal.find(".content")?.append(content);

	$(document.body).append($modal);
}

function isModalPresent() {
	return dom("#modal-wrapper") !== null;
}

export function hideModal() {
	dom("#modal-wrapper")?.remove();

	if (modalQueue.length > 0) {
		const nextModal = modalQueue.shift();
		if (!nextModal) return;

		showModal(nextModal.title, nextModal.content);
		return;
	}

	dom("#root")?.removeClass("modal-present");
	$background.removeClass("increase-opacity");
	setTimeout(() => {
		$background.addClass("hidden");
	}, 200);
}

export function lockModal() {
	isModalUnlocked = false;
}

export function unlockModal() {
	isModalUnlocked = true;
}
