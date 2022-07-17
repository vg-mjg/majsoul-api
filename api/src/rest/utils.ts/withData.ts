import * as express from 'express';
import { matchedData, validationResult } from 'express-validator';
import { logError } from './logError';

export function withData<DataType, RequestType, ResponseType>(
	callback: (data: DataType, request: express.Request, response: express.Response<ResponseType>) => Promise<void> | void) {
	return logError(async (request, response) => {
		const errors = validationResult(request);
		if (!errors.isEmpty()) {
			response.status(400).json({ errors: errors.array() } as any);
			return;
		}
		await callback(
			matchedData(request, { includeOptionals: false }) as DataType,
			request,
			response
		);
	});
}
