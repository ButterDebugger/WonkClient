import { dom } from "https://debutter.dev/x/js/dom.js@1.0.0";

const $background = dom(`<div id="modal-background" class="hidden"></div>`);
const modalQueue = [];
let isModalUnlocked = true; // TODO: provide some indicator that the modal is locked

dom("body").append($background);

export function showModal(title, content) {
	if (isModalPresent()) {
		modalQueue.push([title, content]);
		return;
	}

	// Play background animation
	dom("#root").addClass("modal-present");

	$background.removeClass("hidden");

	if (!$background.hasClass("increase-opacity"))
		setTimeout(() => {
			$background.addClass("increase-opacity");
		}, 1);

	// Create and append the modal to the body
	const $modal = dom(`<div id="modal-wrapper">
        <div class="header">
            <span class="title">Modal</span>
        </div>
        <div class="content"></div>
    </div>`);

	$modal.find(".title").text(title);

	$modal.find(".header").append(
		dom(`<div class="ic-small-container">
				<span class="ic-small ic-xmark"></span>
			</div>`).on("click", () => {
			if (isModalUnlocked) {
				hideModal();
			}
		}),
	);

	$modal.find(".content").append(content);

	dom("body").append($modal);
}

function isModalPresent() {
	return dom("#modal-wrapper") !== null;
}

export function hideModal() {
	dom("#modal-wrapper").remove();

	if (modalQueue.length > 0) {
		showModal(...modalQueue.shift());
		return;
	}

	dom("#root").removeClass("modal-present");
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
