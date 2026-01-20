import { NavLink, type NavLinkProps } from "react-router-dom";

export function Button({
	children,
	...props
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className="
				flex flex-col gap-4 pt-3 pb-3 pl-4 pr-4
				bg-container dark:bg-container-dark
				hover:bg-container-hover dark:hover:bg-container-hover-dark
				active:bg-container-active dark:active:bg-container-active-dark
				border rounded-3xl
				border-border dark:border-border-dark hover:border-border-hover
				transition-colors
				cursor-pointer
			"
			{...props}
		>
			{children}
		</div>
	);
}

export function LinkButton({ children, ...props }: { children: React.ReactNode } & NavLinkProps) {
	return (
		<NavLink
			className="
				flex flex-col gap-4 pt-3 pb-3 pl-4 pr-4
				bg-container dark:bg-container-dark
				hover:bg-container-hover dark:hover:bg-container-hover-dark
				active:bg-container-active dark:active:bg-container-active-dark
				border rounded-3xl
				border-border dark:border-border-dark hover:border-border-hover
				transition-colors
				cursor-pointer
			"
			{...props}
		>
			{children}
		</NavLink>
	);
}
