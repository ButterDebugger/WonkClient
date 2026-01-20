import { NavLink, type NavLinkProps } from "react-router-dom";

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
	className,
	...props
}: {
	children: React.ReactNode;
	className?: string;
} & NavLinkProps) {
	return (
		<NavLink
			className={"text-primary hover:underline" + (className ? " " + className : "")}
			{...props}
		>
			{children}
		</NavLink>
	);
}
