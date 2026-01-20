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

export default function Login() {
	const [searchParams] = useSearchParams();

	const code = "123456"; // searchParams.get("code");
	const state = searchParams.get("state");

	return (
		<Centered>
			<ErrorBoundary fallback={<ErrorCard message="Something went wrong" />}>
				<Suspense fallback={<LoadingCard />}>
					{code && state ? (
						<OauthStep
							code={code}
							state={state}
							storedStatePromise={tbForage.get<string>("state")}
							verifierPromise={tbForage.get<string>("verifier")}
							homeserverPromise={tbForage.get<Homeserver>("homeserver")}
						/>
					) : (
						<InitCard
							tokenPromise={tbForage.get<string>("token")}
							homeserverPromise={tbForage.get<Homeserver>("homeserver")}
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

	return token === null || homeserver === null ? (
		<Unauthorized />
	) : (
		<Authorized loggedInPromise={whoAmI(homeserver, token)} />
	);
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

	return (
		<AccessStep
			homeserver={homeserver}
			accessPromise={access(homeserver, { verifier, state: storedState }, { code, state })}
		/>
	);
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

	return (
		<SaveLoginStep
			token={token}
			homeserver={homeserver}
			saveTokenPromise={tbForage.set("token", token)}
			saveHomeserverPromise={tbForage.set("homeserver", homeserver)}
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

	return <Authorized loggedInPromise={whoAmI(homeserver, token)} />;
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
				<span className="font-bold">@{"example:debutter.dev"}</span>
			</p>
			<Button>Open App</Button>
			<Button>Logout</Button>
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
