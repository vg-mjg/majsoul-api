import { Player } from "../Player.js";

export interface ContestTeam<Id = any> {
	_id: Id;
	name?: string;
	image?: string;
	imageLarge?: string;
	players?: Player<Id>[];
	color?: string;
	contrastBadgeFont?: boolean;
	anthem?: string;
}
