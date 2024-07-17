export interface User<Id = any> {
	_id?: Id;
	nickname?: string;
	password?: {
		salt: string;
		hash: string;
	};
	scopes?: string[];
}
