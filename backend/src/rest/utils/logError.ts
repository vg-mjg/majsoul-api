import * as express from "express";

export function logError<RequestType, ResponseType>(callback: (request: express.Request, response: express.Response<ResponseType>) => Promise<void> | void) {
	return async (request: express.Request, response: express.Response<ResponseType>) => {
		try {
			await callback(request, response);
		} catch (error) {
			console.log(error);
			response.status(500).send(error);
		}
	};
}
