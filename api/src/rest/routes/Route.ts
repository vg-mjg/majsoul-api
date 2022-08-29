import * as express from 'express';

export abstract class Route<State> implements Route<State> {
	protected state: State;
	protected readonly childRoutes?: Route<State>[];

	constructor( childRoutes?: Route<State>[]){
		this.childRoutes = childRoutes ?? [];
	}

	public setState(state: State): void {
		this.state = state;
		for(const child of this.childRoutes) {
			child.setState(state);
		}
	}

	public registerPublicMethods(app: express.Express): express.Express {
		for(const child of this.childRoutes) {
			app = child.registerPublicMethods(app);
		}
		return app;
	}

	public registerAdminMethods(app: express.Express): express.Express {
		for(const child of this.childRoutes) {
			app = child.registerPublicMethods(app);
		}
		return app;
	}
}
