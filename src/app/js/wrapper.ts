// @ts-ignore
import { domParser } from "https://debutter.dev/x/js/utils.js@1.2";

const viewWrappers: Map<string, ViewWrapper> = new Map();

export interface ViewWrapper {
	header: HTMLElement;
	content: HTMLElement;
	footer: HTMLElement;
	backAction: (() => void) | null;
}

export function hasWrapper(key: string) {
	return viewWrappers.has(key);
}

export function getWrapper(key: string): ViewWrapper | undefined {
	return viewWrappers.get(key);
}

export function getOrCreateWrapper(key: string): ViewWrapper {
	const existingWrapper = getWrapper(key);
	if (existingWrapper) return existingWrapper;

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
