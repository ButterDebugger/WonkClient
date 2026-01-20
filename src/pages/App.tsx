import { Suspense, use, useEffect, useMemo, useState } from "react";
import { Client, generateKeyPair, type Homeserver } from "../lib/client.ts";
import * as tbForage from "../lib/tbForage.ts";
import type { KeyPair } from "../lib/cryption.ts";

export let client: Client | null = null;

// me when i use you for parts and sink my teeth into you

export default function App() {
	const tokenPromise = tbForage.get<string>("token");
	const homeserverPromise = tbForage.get<Homeserver>("homeserver");
	const keyPairPromise = tbForage
		.get<KeyPair>("keyPair")
		.then((keyPair) => {
			if (keyPair) return keyPair;

			console.log("Generating key pair...");

			return generateKeyPair("username");
		})
		.then(async (keyPair) => {
			console.log("Saving key pair...");

			await tbForage.set("keyPair", keyPair);

			return keyPair;
		});

	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<Chat
					tokenPromise={tokenPromise}
					homeserverPromise={homeserverPromise}
					keyPairPromise={keyPairPromise}
				/>
			</Suspense>
		</>
	);
}

function Chat({
	tokenPromise,
	homeserverPromise,
	keyPairPromise,
}: {
	tokenPromise: Promise<string | null>;
	homeserverPromise: Promise<Homeserver | null>;
	keyPairPromise: Promise<KeyPair | null>;
}) {
	const token = use(tokenPromise);
	const homeserver = use(homeserverPromise);
	const keyPair = use(keyPairPromise);

	if (token === null || homeserver === null || keyPair === null) {
		return <div>Failed to load chat</div>;
	}

	const [client, setClient] = useState<Client | null>(null);

	useEffect(() => {
		const c = new Client(token, keyPair.publicKey, keyPair.privateKey, homeserver.baseUrl);

		setClient(c);

		return () => {
			c.stream.disconnect();
			setClient(null);
		};
	}, [token, keyPair, homeserver]);

	// const client = new Client(token, keyPair.publicKey, keyPair.privateKey, homeserver.baseUrl);

	return <div>Chat</div>;
}
