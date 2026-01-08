export function MutedText({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<span
			className={
				"text-text-secondary dark:text-text-secondary-dark" +
				(className ? " " + className : "")
			}
		>
			{children}
		</span>
	);
}

export function LinkText({
	children,
	href,
	className,
}: {
	children: React.ReactNode;
	href: string;
	className?: string;
}) {
	return (
		<a
			className={"text-primary hover:underline" + (className ? " " + className : "")}
			href={href}
		>
			{children}
		</a>
	);
}
