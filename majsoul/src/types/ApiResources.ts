export interface ApiResources {
	version: string;
	pbVersion: string;
	serverList: {
		servers: string[];
	};
	protobufDefinition: any;
}
