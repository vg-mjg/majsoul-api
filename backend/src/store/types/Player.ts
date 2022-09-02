import { Player as MajsoulPlayer } from "majsoul";

export interface Player<Id = any> extends Partial<MajsoulPlayer> {
	_id?: Id;
	majsoulFriendlyId?: number;
	displayName?: string;
}
