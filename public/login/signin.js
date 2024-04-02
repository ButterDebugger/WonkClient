import * as binForage from "https://debutter.dev/x/js/binforage.js";

const errorMessageEle = document.getElementById("error-message");
const homeserverEle = document.getElementById("homeserver");
const homeserverLabelEle = document.querySelector("label[for=homeserver]");
const authBtn = document.getElementById("auth-btn");

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

	window.open(url, title, popupFeatures);
}

window.addEventListener("message", (event) => {
	let { token, publicKey, privateKey } = event.data;

	if (token && publicKey && privateKey) {
		binForage.set("token", token);
		binForage.set("keyPair", {
			publicKey: publicKey,
			privateKey: privateKey
		});

		location.href = "/app/";
	}
});

// Get last used homeserver from browser
let initialHomeserver = await binForage.get("homeserver");

if (initialHomeserver !== null) {
	homeserverEle.value = initialHomeserver.namespace;
}

authBtn.addEventListener("click", () => authenticate());

async function authenticate() {
	let ogText = authBtn.innerText;

	authBtn.disabled = true;
	homeserverEle.disabled = true;
	errorMessageEle.innerText = "";

	function restoreInputs() {
		authBtn.disabled = false;
		homeserverEle.disabled = false;

		authBtn.innerText = ogText;
	}

	function requestErrorHandler(err, defaultMessage = "Something went wrong") {
		errorMessageEle.innerText = err?.response?.data?.message ?? defaultMessage;
		restoreInputs();
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

			openCenteredPopup(
				`${homeserver.base_url}/auth/signin`,
				"Authorize Wonk Chat"
			);
		})
		.catch((err) => requestErrorHandler(err, "Something went wrong whilst locating"));
}
