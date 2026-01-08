export function ArticleWrapper({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-col gap-4 flex-1 max-w-237 ml-auto mr-auto">{children}</div>;
}
