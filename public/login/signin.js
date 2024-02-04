import cookies from "https://cdn.jsdelivr.net/npm/js-cookie@3.0.5/+esm";
import * as cryption from "../cryption.js";
import { delay } from "https://debutter.dev/x/js/utils.js@1.2";
import * as binForage from "https://debutter.dev/x/js/binforage.js";

const stepNumberEle = document.getElementById("step-number");
const errorMessageEle = document.getElementById("error-message");

const stepOneEle = document.getElementById("step-one");
const homeserverEle = document.getElementById("homeserver");
const usernameEle = document.getElementById("username");
const passwordEle = document.getElementById("password");
const nextBtn = document.getElementById("next-step");

const stepTwoEle = document.getElementById("step-two");
const keySizeEle = document.getElementById("key-size");
const generateKeyPairBtn = document.getElementById("generate-key-pair");
const publicKeyEle = document.getElementById("public-key");
const privateKeyEle = document.getElementById("private-key");
const previousStepBtn = document.getElementById("previous-step");
const submitBtn = document.getElementById("submit");

tippy(homeserverEle, {
    content: "<p style=\"text-align: center; margin: 0px;\">The server you will be connected to<br>(also where your data will be stored)</p>",
    allowHTML: true,
    delay: [500, 0]
});

function updateStepButtons() {
    // Update next step button
    if (homeserverEle.validity.valid && usernameEle.validity.valid && passwordEle.validity.valid) {
        nextBtn.disabled = false;
    } else {
        nextBtn.disabled = true;
    }
    
    // Update submit button
    if (
        homeserverEle.validity.valid &&
        usernameEle.validity.valid &&
        passwordEle.validity.valid &&
        publicKeyEle.validity.valid &&
        privateKeyEle.validity.valid
    ) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

function updateGenerateButton() {
    if (privateKeyEle.validity.valid && publicKeyEle.validity.valid) {
        generateKeyPairBtn.classList.remove("highlight");
    } else {
        generateKeyPairBtn.classList.add("highlight");
    }
}

homeserverEle.addEventListener("input", () => updateStepButtons());
usernameEle.addEventListener("input", () => updateStepButtons());
passwordEle.addEventListener("input", () => updateStepButtons());

nextBtn.addEventListener("click", () => {
    stepNumberEle.innerText = "2";
    stepOneEle.classList.add("hidden");
    stepTwoEle.classList.remove("hidden");
});

previousStepBtn.addEventListener("click", () => {
    stepNumberEle.innerText = "1";
    stepOneEle.classList.remove("hidden");
    stepTwoEle.classList.add("hidden");
});

let initialHomeserver = await binForage.get("homeserver");
let initialKeyPair = await binForage.get("keyPair");

if (initialHomeserver !== null) {
    homeserverEle.value = initialHomeserver.namespace;
}

if (initialKeyPair !== null) {
    publicKeyEle.value = initialKeyPair.publicKey;
    privateKeyEle.value = initialKeyPair.privateKey;
} else {
    privateKeyEle.addEventListener("input", () => updateGenerateButton());
    publicKeyEle.addEventListener("input", () => updateGenerateButton());
    updateGenerateButton();
}

generateKeyPairBtn.addEventListener("click", async () => {
    let { publicKey, privateKey } = await cryption.generateKeyPair(usernameEle.value, parseInt(keySizeEle.value));

    publicKeyEle.value = publicKey;
    privateKeyEle.value = privateKey;
    updateGenerateButton();
    updateStepButtons();
});

publicKeyEle.addEventListener("input", () => updateStepButtons());
privateKeyEle.addEventListener("input", () => updateStepButtons());

submitBtn.addEventListener("click", () => authenticate());

async function authenticate(speed = 500) {
    let ogText = submitBtn.innerText;

    submitBtn.disabled = true;
    homeserverEle.disabled = true;
    usernameEle.disabled = true;
    passwordEle.disabled = true;
    keySizeEle.disabled = true;
    generateKeyPairBtn.disabled = true;
    privateKeyEle.disabled = true;
    publicKeyEle.disabled = true;
    errorMessageEle.innerText = "";

    function restoreInputs() {
        submitBtn.disabled = false;
        homeserverEle.disabled = false;
        usernameEle.disabled = false;
        passwordEle.disabled = false;
        keySizeEle.disabled = false;
        generateKeyPairBtn.disabled = false;
        privateKeyEle.disabled = false;
        publicKeyEle.disabled = false;

        submitBtn.innerText = ogText;
    }

    function requestErrorHandler(err, defaultMessage = "Something went wrong") {
        errorMessageEle.innerText = err?.response?.data?.message ?? defaultMessage;
        restoreInputs();
    }

    submitBtn.innerText = "Saving Login Info";
    await delay(speed);

    let keyPair = {
        publicKey: publicKeyEle.value,
        privateKey: privateKeyEle.value
    };

    await binForage.set("keyPair", keyPair);

    submitBtn.innerText = "Locating";
    await delay(speed);

    axios.get(`https://${homeserverEle.value}/.well-known/wonk`).then(async (res) => {
        let { homeserver } = res.data;

        await binForage.set("homeserver", {
            namespace: homeserverEle.value,
            baseUrl: homeserver.base_url
        });

        submitBtn.innerText = "Authorizing";
        await delay(speed);

        axios.post(`${homeserver.base_url}/auth/login`, {
            username: usernameEle.value,
            password: passwordEle.value,
            publicKey: keyPair.publicKey
        }).then(async (res) => {
            let { id, message } = res.data;
            
            submitBtn.innerText = "Verifying";
            await delay(speed);

            let decrypted = await cryption.decrypt(message, keyPair.privateKey);

            axios.post(`${homeserver.base_url}/auth/verify/${id}`, {
                message: decrypted
            }).then((res) => {
                let { id, token } = res.data;
                
                cookies.set("token", token, { expires: 365 });
                cookies.set("session", id); // Create session cookie
                
                location.href = "/app/";
            }).catch(err => requestErrorHandler(err, "Something went wrong whilst verifying"));
        }).catch(err => requestErrorHandler(err, "Something went wrong whilst authorizing"));
    }).catch(err => requestErrorHandler(err, "Something went wrong whilst locating"));
}
