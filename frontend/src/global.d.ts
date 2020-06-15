declare module '*.sass' {
	interface IClassNames {
		[className: string]: string
	}
	const classNames: IClassNames;
	export = classNames;
}
