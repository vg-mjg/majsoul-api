import * as express from "express";

export type RouteMethodRegister<State> = (app: express.Express, state: State) => express.Express;

export interface Route<State> {
	childRoutes?: Route<State>[];
	publicMethods?: RouteMethodRegister<State>[];
	adminMethods?: RouteMethodRegister<State>[];
}

function registerMethods<State>(
	route: Route<State>,
	state: State,
	app: express.Express,
	methodAccessCallback: (route: Route<State>) => RouteMethodRegister<State>[]
): express.Express {
	if (!route) {
		return app;
	}

	const methods = methodAccessCallback(route) ?? [];

	for (const method of methods) {
		app = method(app, state);
	}

	const childRoutes = route.childRoutes ?? [];

	for (const childRoute of childRoutes) {
		app = registerMethods(childRoute, state, app, methodAccessCallback);
	}

	return app;
}

const publicMethodsAccessor = <State>(route: Route<State>) => route.publicMethods;
const adminMethodsAccessor = <State>(route: Route<State>) => route.adminMethods;

export function registerPublicMethods<State>(
	route: Route<State>,
	state: State,
	app: express.Express,
): express.Express {
	return registerMethods(route, state, app, publicMethodsAccessor);
}

export function registerAdminMethods<State>(
	route: Route<State>,
	state: State,
	app: express.Express,
): express.Express {
	return registerMethods(route, state, app, adminMethodsAccessor);
}
