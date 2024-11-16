import * as openpgp from "openpgp";

export interface KeyPair {
	publicKey: string;
	privateKey: string;
}

/*
 * Binary message functions
 */

export async function decryptData(
	message: Uint8Array,
	privateKey: string,
): Promise<Uint8Array> {
	const { data: decrypted } = await openpgp.decrypt({
		message: await openpgp.readMessage({ binaryMessage: message }),
		decryptionKeys: await openpgp.readKey({ armoredKey: privateKey }),
		format: "binary",
	});

	return decrypted;
}

// export async function encryptData(
// 	message: string,
// 	publicKey: string,
// ): Promise<Uint8Array> {
// 	return await openpgp.encrypt({
// 		message: await openpgp.createMessage({ binary: message }),
// 		encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
// 		format: "binary",
// 	});
// }

/*
 * String message functions
 */

// export async function decryptText(
// 	message: string,
// 	privateKey: string,
// ): Promise<string> {
// 	const { data: decrypted } = await openpgp.decrypt({
// 		message: await openpgp.readMessage({ armoredMessage: message }),
// 		decryptionKeys: await openpgp.readKey({ armoredKey: privateKey }),
// 	});

// 	return decrypted;
// }

/**
 * Encrypts a string message with a public key
 *
 * @param message The string message to encrypt
 * @param publicKey The public key to encrypt the message with
 * @returns The encrypted message as an PGP armored message
 */
export async function encryptText(
	message: string,
	publicKey: string,
): Promise<string> {
	return await openpgp.encrypt({
		message: await openpgp.createMessage({ text: message }),
		encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
	});
}

/**
 * Signs a message with a private key
 *
 * @param message The message to be signed
 * @param privateKey The private key to sign the message with
 * @returns The signed message
 */
export async function signText(
	message: string,
	privateKey: string,
): Promise<string> {
	return await openpgp.sign({
		message: await openpgp.createMessage({ text: message }),
		signingKeys: await openpgp.readKey({ armoredKey: privateKey }),
	});
}

/**
 * Generates an RSA key pair
 *
 * @param name The name associated with the key pair
 * @param bits The number of bits for the RSA key
 * @returns The RSA key pair
 */
export async function generateKeyPair(
	name: string,
	bits = 2048,
): Promise<KeyPair> {
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
