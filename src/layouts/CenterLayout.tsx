export function Centered({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-full content-center">
			<div className="p-4 w-min m-auto">{children}</div>
		</div>
	);
}
