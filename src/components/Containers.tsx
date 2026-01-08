export function VerticalContainer({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={
				`flex flex-col gap-4 p-4
				bg-container dark:bg-container-dark
				border rounded-3xl
				border-border dark:border-border-dark` + (className ? ` ${className}` : "")
			}
		>
			{children}
		</div>
	);
}

export function HorizontalContainer({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={
				`flex flex-row gap-4 p-4
				bg-container dark:bg-container-dark
				border rounded-3xl
				border-border dark:border-border-dark` + (className ? ` ${className}` : "")
			}
		>
			{children}
		</div>
	);
}
