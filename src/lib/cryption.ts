import * as openpgp from "openpgp";

export async function decryptMessage(message: string, privateKey: string) {
	const { data: decrypted } = await openpgp.decrypt({
		message: await openpgp.readMessage({ armoredMessage: message }),
		decryptionKeys: await openpgp.readKey({ armoredKey: privateKey }),
	});

	return decrypted;
}

export async function encryptMessage(message: string, publicKey: string) {
	return await openpgp.encrypt({
		message: await openpgp.createMessage({ text: message }),
		encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
	});
}

export async function signMessage(message: string, privateKey: string) {
	return await openpgp.sign({
		message: await openpgp.createMessage({ text: message }),
		signingKeys: await openpgp.readKey({ armoredKey: privateKey }),
	});
}

export async function generateKeyPair(name: string, bits = 2048) {
	const { publicKey, privateKey } = await openpgp.generateKey({
		type: "rsa",
		rsaBits: bits,
		userIDs: [
			{
				name: name,
			},
		],
	});

	return {
		publicKey: publicKey,
		privateKey: privateKey,
	};
}
