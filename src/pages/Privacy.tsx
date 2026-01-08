import { LinkText, MutedText } from "../components/Texts";
import { Article } from "../layouts/ArticleLayout";

export default function Privacy() {
	return (
		<Article>
			<div className="text-center">
				<h1 className="text-6xl/[4rem] font-bold font-title mt-10 mb-10">Privacy Policy</h1>
				<p className="text-xl/normal text-center mt-5 mb-5">
					Wonk Chat was built with your privacy in mind.
					<br />
					We understand your privacy is important to you so please take the time to read
					through it.
				</p>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="text-center">
					<h2 className="text-xl font-bold font-title mt-5 mb-5">
						Information we collect
					</h2>
					<MutedText>
						We do not collect any of your personal information. We only collect friendly
						statistics about our site provided by&nbsp;
						<LinkText href="https://www.cloudflare.com/web-analytics/">
							CloudFlare's web analytics
						</LinkText>
						.
					</MutedText>
				</div>
				<div className="text-center">
					<h2 className="text-xl font-bold font-title mt-5 mb-5">
						Changes to this policy
					</h2>
					<MutedText>
						We may update this privacy policy from time to time. Any changes will be
						posted on this page, so please check back periodically to stay informed
						about how we are protecting your information.
					</MutedText>
				</div>
				<div className="text-center">
					<h2 className="text-xl font-bold font-title mt-5 mb-5">Data security</h2>
					<MutedText>
						We are committed to ensuring the security of your information. All of your
						data is stored locally in your browser and stays on your device, not to be
						sent to us or any third party.
					</MutedText>
				</div>
				<div className="text-center">
					<h2 className="text-xl font-bold font-title mt-5 mb-5">Contact us</h2>
					<MutedText>
						If you have any questions or concerns about our privacy policy or the way we
						handle your information, please feel free to contact us at&nbsp;
						<LinkText href="mailto:contact@debutter.dev">contact@debutter.dev</LinkText>
						.
					</MutedText>
				</div>
			</div>
			<p className="text-xl/normal text-center mt-5 mb-5">
				By using Wonk Chat, you agree to the terms of this privacy policy.
			</p>
		</Article>
	);
}
