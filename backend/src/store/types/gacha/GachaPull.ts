
export interface GachaPull<Id = any> {
	_id: Id;
	gameId: Id;
	playerId?: Id;
	gachaCardId?: Id;
	gachaGroupId?: Id;
}
