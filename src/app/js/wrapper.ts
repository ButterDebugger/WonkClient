// @ts-ignore
import { domParser } from "https://debutter.dev/x/js/utils.js@1.2";

const viewWrappers = new Map();

export function hasWrapper(key) {
	return viewWrappers.has(key);
}

export function getWrapper(key) {
	return viewWrappers.get(key);
}

export function getOrCreateWrapper(key) {
	if (viewWrappers.has(key)) return viewWrappers.get(key);

	const headerEle = domParser(`<div class="header"></div>`);
	const contentEle = domParser(`<div class="content"></div>`);
	const footerEle = domParser(`<div class="footer"></div>`);

	const wrapper = {
		header: headerEle,
		content: contentEle,
		footer: footerEle,
		backAction: null,
	};

	viewWrappers.set(key, wrapper);
	return wrapper;
}
