import { Suspense, use, useState } from "react";
import { VerticalContainer } from "../components/Containers";
import { Centered } from "../layouts/CenterLayout";
import { Button } from "../components/Button";
import { MutedText } from "../components/Texts";
import { ErrorBoundary } from "react-error-boundary";
import * as tbForage from "../lib/tbForage.ts";
import { access, locateOauth, whoAmI } from "../lib/authorizer";
import type { Homeserver } from "../lib/types";
import { useSearchParams } from "react-router-dom";
import { Input } from "../components/Input.tsx";

// Keep a cache of promises to avoid recomputation
const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
	if (!cache.has(key)) {
		cache.set(key, fn());
	}
	return cache.get(key) as Promise<T>;
}

export default function Login() {
	const [searchParams] = useSearchParams();

	const code = "123456"; // searchParams.get("code");
	const state = searchParams.get("state");

	const storedStatePromise = cached("state", () => tbForage.get<string>("state"));
	const verifierPromise = cached("verifier", () => tbForage.get<string>("verifier"));
	const homeserverPromise = cached("homeserver", () => tbForage.get<Homeserver>("homeserver"));
	const tokenPromise = cached("token", () => tbForage.get<string>("token"));

	return (
		<Centered>
			<ErrorBoundary fallback={<ErrorCard message="Something went wrong" />}>
				<Suspense fallback={<LoadingCard />}>
					{code && state ? (
						<OauthStep
							code={code}
							state={state}
							storedStatePromise={storedStatePromise}
							verifierPromise={verifierPromise}
							homeserverPromise={homeserverPromise}
						/>
					) : (
						<InitCard
							tokenPromise={tokenPromise}
							homeserverPromise={homeserverPromise}
						/>
					)}
				</Suspense>
			</ErrorBoundary>
		</Centered>
	);
}

function ErrorCard({ message }: { message: string }) {
	return (
		<VerticalContainer className="min-w-75 text-center">
			<h1 className="text-3xl font-bold">Error</h1>
			<p>{message}</p>
			<Button
				onClick={() => {
					cache.clear();

					// TODO: avoid reload
					location.href = "/login";
				}}
			>
				Retry
			</Button>
		</VerticalContainer>
	);
}

function LoadingCard() {
	return (
		<VerticalContainer className="min-w-75 text-center">
			<h1 className="text-3xl font-bold">Loading</h1>
			<p>Logging you in...</p>
		</VerticalContainer>
	);
}

function InitCard({
	tokenPromise,
	homeserverPromise,
}: {
	tokenPromise: Promise<string | null>;
	homeserverPromise: Promise<Homeserver | null>;
}) {
	const token = use(tokenPromise);
	const homeserver = use(homeserverPromise);

	if (token === null || homeserver === null) {
		return <Unauthorized />;
	}

	const loggedInPromise = cached(`whoami-${token}`, () => whoAmI(homeserver, token));

	return <Authorized loggedInPromise={loggedInPromise} />;
}

function OauthStep({
	code,
	state,
	storedStatePromise,
	verifierPromise,
	homeserverPromise,
}: {
	code: string;
	state: string;
	storedStatePromise: Promise<string | null>;
	verifierPromise: Promise<string | null>;
	homeserverPromise: Promise<Homeserver | null>;
}) {
	const storedState = use(storedStatePromise);
	const verifier = use(verifierPromise);
	const homeserver = use(homeserverPromise);

	if (storedState === null || verifier === null || homeserver === null) {
		return <ErrorCard message="Failed to finish login" />;
	}

	const accessPromise = cached(`access-${code}`, () =>
		// NOTE: the code might not be a good key to cache here
		access(homeserver, { verifier, state: storedState }, { code, state }),
	);

	return <AccessStep homeserver={homeserver} accessPromise={accessPromise} />;
}

function AccessStep({
	homeserver,
	accessPromise,
}: {
	homeserver: Homeserver;
	accessPromise: Promise<{ token: string } | null>;
}) {
	const accessPayload = use(accessPromise);

	if (accessPayload === null) {
		return <ErrorCard message="Failed to finish login" />;
	}

	const { token } = accessPayload;

	const saveTokenPromise = cached(`save-token-${token}`, () => tbForage.set("token", token));
	const saveHomeserverPromise = cached(`save-hs-${homeserver.namespace}`, () =>
		tbForage.set("homeserver", homeserver),
	);

	return (
		<SaveLoginStep
			token={token}
			homeserver={homeserver}
			saveTokenPromise={saveTokenPromise}
			saveHomeserverPromise={saveHomeserverPromise}
		/>
	);
}

function SaveLoginStep({
	token,
	homeserver,
	saveTokenPromise,
	saveHomeserverPromise,
}: {
	token: string;
	homeserver: Homeserver;
	saveTokenPromise: Promise<boolean>;
	saveHomeserverPromise: Promise<boolean>;
}) {
	use(saveTokenPromise);
	use(saveHomeserverPromise);

	const loggedInPromise = cached(`whoami-${token}`, () => whoAmI(homeserver, token));

	return <Authorized loggedInPromise={loggedInPromise} />;
}

function Authorized({
	loggedInPromise,
}: {
	loggedInPromise: Promise<{ username: string } | null>;
}) {
	const isLoggedIn = use(loggedInPromise);

	return isLoggedIn === null ? (
		<Unauthorized />
	) : (
		<VerticalContainer className="min-w-75 text-center">
			<h1 className="text-3xl font-bold">Continue As</h1>
			<p>
				<MutedText>You are logged in as</MutedText>{" "}
				<span className="font-bold">@{isLoggedIn.username + ":debutter.dev"}</span>
			</p>
			<Button>Open App</Button>
			<Button
				onClick={async () => {
					await tbForage.remove("state");
					await tbForage.remove("verifier");
					await tbForage.remove("homeserver");
					await tbForage.remove("token");

					// TODO: avoid reload
					location.href = "/login";
				}}
			>
				Logout
			</Button>
		</VerticalContainer>
	);
}

function Unauthorized() {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [homeserver, setHomeserver] = useState("debutter.dev");

	return (
		<VerticalContainer className="min-w-75 text-center">
			<h1 className="text-3xl font-bold">Login</h1>
			{errorMessage && <p className="text-warning">{errorMessage}</p>}
			<h2>Sign Into</h2>
			<Input
				type="text"
				placeholder="Homeserver"
				onChange={(e) => setHomeserver(e.target.value)}
				value={homeserver}
			/>
			<Button
				onClick={async () => {
					const oauth = await locateOauth(homeserver);

					if (oauth === null) {
						setErrorMessage("Failed to locate homeserver");
						return;
					}

					// Store the state
					await tbForage.set("state", oauth.state);
					await tbForage.set("verifier", oauth.verifier);
					await tbForage.set("homeserver", oauth.homeserver);

					// Redirect to the homeserver
					location.href = oauth.redirectUrl;
				}}
			>
				Login
			</Button>
		</VerticalContainer>
	);
}
