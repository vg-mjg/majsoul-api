
export interface ContestPhaseTransition<Id = string> {
	name?: string;
	_id: Id;
	startTime: number;
	teams?: {
		top?: number;
	};
	score?: {
		half?: true;
		nil?: true;
	};
}
