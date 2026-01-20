export function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className="
				pt-3 pb-3 pl-4 pr-4
				bg-container dark:bg-container-dark
				focus:bg-container-hover dark:focus:bg-container-hover-dark
				border rounded-3xl
				border-border dark:border-border-dark focus:border-border-hover
				transition-colors
				outline-none
			"
			{...props}
		/>
	);
}
