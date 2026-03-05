import { createContext, useContext } from "react";
import type { Client } from "../../lib/client";

export const ClientContext = createContext<Client | null>(null);

export function useClientContext() {
	const client = useContext(ClientContext);

	if (client === null) {
		throw new Error("Client is null");
	}

	return client;
}
