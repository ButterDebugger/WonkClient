import * as binForage from "https://debutter.dev/x/js/binforage.js";

const errorMessageEle = document.getElementById("error-message");
const homeserverEle = document.getElementById("homeserver");
const homeserverLabelEle = document.querySelector("label[for=homeserver]");
const authBtn = document.getElementById("auth-btn");
const continueBtn = document.getElementById("continue-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginStage = document.getElementById("login-stage");
const continueStage = document.getElementById("continue-stage");
const usernameEle = document.getElementById("username");

let ogAuthBtnText = authBtn.innerText;

tippy([homeserverEle, homeserverLabelEle], {
	content: '<p style="text-align: center; margin: 0px;">The server you will be connected to<br>(also where your data will be stored)</p>',
	allowHTML: true,
	delay: [500, 0]
});

function updateAuthorizeButton() {
	if (homeserverEle.validity.valid) {
		authBtn.disabled = false;
	} else {
		authBtn.disabled = true;
	}
}

homeserverEle.addEventListener("input", () => updateAuthorizeButton());

function openCenteredPopup(url, title) {
	const popupWidth = window.outerWidth * 0.5;
	const popupHeight = window.outerHeight * 0.5;

	const left = (window.outerWidth - popupWidth) / 2 + screenLeft;
	const top = (window.outerHeight - popupHeight) / 2 + screenTop;

	const popupFeatures = `
        scrollbars=yes,
        width=${popupWidth},
        height=${popupHeight},
        left=${left},
        top=${top}
    `;

	return window.open(url, title, popupFeatures);
}

window.addEventListener("message", async (event) => {
	let { token, username, publicKey, privateKey } = event.data;

	if (token && username && publicKey && privateKey) {
		binForage.set("token", token);
		binForage.set("username", username);
		binForage.set("keyPair", {
			publicKey: publicKey,
			privateKey: privateKey
		});

		let { namespace } = await binForage.get("homeserver");

		usernameEle.innerText = `@${username}@${namespace}`;
		loginStage.classList.add("hidden");
		continueStage.classList.remove("hidden");

		restoreAuthInputs();
	}
});

// Get last used homeserver from browser
let initialHomeserver = await binForage.get("homeserver");
let initialUsername = await binForage.get("username");
let initialToken = await binForage.get("token");
let initialKeyPair = await binForage.get("keyPair");

if (initialHomeserver !== null) {
	homeserverEle.value = initialHomeserver.namespace;
}
if (initialHomeserver !== null && initialToken !== null && initialUsername !== null && initialKeyPair !== null) {
	usernameEle.innerText = `@${initialUsername}@${initialHomeserver.namespace}`;
	loginStage.classList.add("hidden");
	continueStage.classList.remove("hidden");
} else {
	loginStage.classList.remove("hidden");
}

authBtn.addEventListener("click", () => authenticate());

continueBtn.addEventListener("click", () => {
	location.href = "/app/";
});

logoutBtn.addEventListener("click", async () => {
	await binForage.remove("token");
	await binForage.remove("keyPair");

	loginStage.classList.remove("hidden");
	continueStage.classList.add("hidden");
});

function restoreAuthInputs() {
	authBtn.disabled = false;
	homeserverEle.disabled = false;

	authBtn.innerText = ogAuthBtnText;
}

async function authenticate() {
	authBtn.disabled = true;
	homeserverEle.disabled = true;
	errorMessageEle.innerText = "";

	function requestErrorHandler(err, defaultMessage = "Something went wrong") {
		errorMessageEle.innerText = err?.response?.data?.message ?? defaultMessage;
		restoreAuthInputs();
	}

	authBtn.innerText = "Locating";

	axios.get(`https://${homeserverEle.value}/.well-known/wonk`)
		.then(async (res) => {
			let { homeserver } = res.data;

			await binForage.set("homeserver", {
				namespace: homeserverEle.value,
				baseUrl: homeserver.base_url
			});

			authBtn.innerText = "Authorizing";

			let popup = openCenteredPopup(
				`${homeserver.base_url}/auth/signin`,
				"Authorize Wonk Chat"
			);

			window.addEventListener("unload", () => {
				popup.close();
			});
		})
		.catch((err) => requestErrorHandler(err, "Something went wrong whilst locating"));
}
