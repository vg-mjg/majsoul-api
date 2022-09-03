declare module '*.sass' {
	interface IClassNames {
		[className: string]: string
	}
	const classNames: IClassNames;
	export = classNames;
}

declare module '*.scss' {
	interface IClassNames {
		[className: string]: string
	}
	const classNames: IClassNames;
	export = classNames;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.mp3";
