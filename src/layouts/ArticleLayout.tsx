import { LinkButton } from "../components/Button";
import { HorizontalContainer, VerticalContainer } from "../components/Containers";
import { Logo } from "../components/Icon";
import { MutedText, LinkText } from "../components/Texts";

export function Article({
	children,
	backHref = "/",
	backText = "Back Home",
}: {
	children: React.ReactNode;
	backHref?: string;
	backText?: string;
}) {
	return (
		<div className="p-4 min-h-full flex flex-col gap-4 flex-1 max-w-237 ml-auto mr-auto">
			{/* Header */}
			<HorizontalContainer className="items-center">
				<Logo />
				<span className="text-2xl font-bold">Wonk Chat</span>
				<div className="flex-1" />
				<LinkButton to={backHref}>{backText}</LinkButton>
			</HorizontalContainer>

			{/* Main content */}
			<div className="flex-1 p-4 flex gap-4 flex-col">{children}</div>

			{/* Footer */}
			<VerticalContainer className="grid grid-cols-3 gap-4">
				<div className="flex flex-col items-center">
					<div className="flex flex-col gap-2">
						<span className="font-bold text-lg">LEGAL</span>
						<MutedText>
							© 2023 ButterDebugger.
							<br />
							All Rights Reserved.
						</MutedText>
						<MutedText>
							Icons used from&nbsp;
							<LinkText to="https://fontawesome.com/">Font Awesome</LinkText>.
						</MutedText>
					</div>
				</div>
				<div className="flex flex-col items-center">
					<div className="flex flex-col gap-2">
						<span className="font-bold text-lg">RESOURCES</span>
						<LinkText to="https://github.com/ButterDebugger/WonkChat/issues">
							Issues
						</LinkText>
						<LinkText to="https://github.com/ButterDebugger/WonkChat">Source</LinkText>
					</div>
				</div>
				<div className="flex flex-col items-center">
					<div className="flex flex-col gap-2">
						<span className="font-bold text-lg">POLICIES</span>
						{/* <LinkText href="/#">Terms of Service</LinkText> */}
						<LinkText to="/privacy/">Privacy Policy</LinkText>
					</div>
				</div>
			</VerticalContainer>
		</div>
	);
}
