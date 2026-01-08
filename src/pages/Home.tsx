// import { useState } from 'react'
import { MutedText } from "../components/Texts";
import { Front } from "../layouts/FrontLayout";

export default function Home() {
	// const [count, setCount] = useState(0)

	return (
		<>
			<Front backHref="/app" backText="Open App">
				<div className="text-center">
					<h1 className="bg-linear-0 bg-clip-text text-transparent from-secondary to-primary text-6xl/[4rem] font-bold font-title mt-10 mb-10">
						Wonky Conversations,
						<br />
						Wonky Connections ❤️
					</h1>
					<p className="text-xl/normal text-center mt-5 mb-5">
						Just another simplistic and purely anonymous chat app for wonky fellows to
						chat in.
					</p>
				</div>
				<div className="grid grid-cols-3 gap-4">
					<div className="text-center">
						<h2 className="text-3xl font-bold font-title mt-8 mb-8">Anonymity</h2>
						<MutedText className="text-xl/normal mt-4 mb-4">
							Chat with others without revealing your identity.
						</MutedText>
					</div>
					<div className="text-center">
						<h2 className="text-3xl font-bold font-title mt-8 mb-8">Simplicity</h2>
						<MutedText className="text-xl/normal mt-4 mb-4">
							A straightforward interface for easy communication.
						</MutedText>
					</div>
					<div className="text-center">
						<h2 className="text-3xl font-bold font-title mt-8 mb-8">Real-time</h2>
						<MutedText className="text-xl/normal mt-4 mb-4">
							Instantly send and receive messages.
						</MutedText>
					</div>
				</div>
			</Front>
		</>
	);
}
