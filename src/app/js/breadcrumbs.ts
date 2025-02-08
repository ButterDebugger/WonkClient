import { dom, html, type DomContext } from "@debutter/dom";

const $breadcrumbs = <DomContext>dom("#breadcrumbs");

export function appendBreadcrumb(
	name: string,
	callback: () => void,
	backtrace: string | null = null
) {
	// Create the new crumb
	const $newCrumb = dom(html`<span class="crumb active"></span>`)
		.text(name)
		.on("click", ({ target }: MouseEvent) => {
			// Trim crumbs
			trimCrumbs(<Element>target);

			// Set the clicked crumb as active
			(<Element>target).classList.add("active");

			// Call the callback
			callback();
		});

	// Remove highlight from any active crumbs
	for (const crumb of $breadcrumbs.findAll(".crumb.active"))
		crumb.removeClass("active");

	// Attempt to find the backtrace and append the new crumb there
	if (backtrace !== null) {
		for (const crumb of $breadcrumbs.findAll(".crumb")) {
			if (crumb.text() === backtrace) {
				// Trim crumbs after the backtraced crumb
				trimCrumbs(crumb.element);

				// Append the new crumb
				crumb.after($newCrumb);
				crumb.after(html`<span class="separator">/</span>`);
				return;
			}
		}
	}

	// Otherwise, append the new crumb
	if ($breadcrumbs.element.children.length > 0)
		$breadcrumbs.append(html`<span class="separator">/</span>`);

	$breadcrumbs.append($newCrumb);
}

/**
 * Remove breadcrumbs after a specific crumb
 */
function trimCrumbs(target: Element) {
	let passed = false;

	for (const crumb of $breadcrumbs.findAll(".crumb, .separator")) {
		if (crumb.element === target) {
			passed = true;
			continue;
		}

		if (!passed) continue;

		crumb.remove();
	}
}
