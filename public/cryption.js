import * as openpgp from "https://cdn.jsdelivr.net/npm/openpgp@5.10.1/+esm";

export async function decrypt(message, privateKey) {
    let { data: decrypted } = await openpgp.decrypt({
        message: await openpgp.readMessage({ armoredMessage: message }),
        decryptionKeys: await openpgp.readKey({ armoredKey: privateKey })
    });

    return decrypted;
}

export async function encrypt(message, publicKey) {
    return await openpgp.encrypt({
        message: await openpgp.createMessage({ text: message }),
        encryptionKeys: await openpgp.readKey({ armoredKey: publicKey })
    });
}

export async function sign(message, privateKey) {
    return await openpgp.sign({
        message: await openpgp.createMessage({ text: message }),
        signingKeys: await openpgp.readKey({ armoredKey: privateKey })
    });
}

export async function readMessage() {
    try {
        return await openpgp.readMessage({ armoredMessage: message });
    } catch (error) {
        return null;
    }
}

export async function generateKeyPair(name, rsaBits = 2048) {
    let { publicKey, privateKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: rsaBits,
        userIDs: [{
            name: name
        }]
    });

    return {
        publicKey: publicKey,
        privateKey: privateKey
    }
}
