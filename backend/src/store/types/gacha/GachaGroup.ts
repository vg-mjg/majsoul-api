import { GachaCard } from "./GachaCard";

export interface GachaGroup<Id = any> {
	_id: Id;
	cards: GachaCard<Id>[];
	onePer: number;
	unique?: boolean;
	priority: number;
	name: string;
}
