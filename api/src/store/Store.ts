import { Collection, MongoClient, ObjectId } from "mongodb";
import { Contest, GameResult, Player } from "./types/types";
import { Majsoul } from "..";

export class Store {

	public async isGameRecorded(game: { majsoulId: string }): Promise<boolean> {
		return await this.gamesCollection.countDocuments({majsoulId: game.majsoulId}, { limit: 1 }) === 1;
	}

	public async recordGame(contest: Contest, gameResult: Majsoul.GameResult): Promise<void> {
		if (gameResult.players.length !== 4) {
			console.log(`Game id ${gameResult.majsoulId} doesn't have enough players, skipping`);
			return;
		}

		const session = (await this.contestCollection.findOne(
			{ _id: contest._id, 'sessions.scheduledTime': { $lte: gameResult.end_time } },
			{ projection: { "sessions.$.games": true, total: true } }
		));

		console.log(`Recording game id ${gameResult.majsoulId}`);
		const gameRecord: GameResult<ObjectId> = {
			_id: undefined,
			sessionId: session.sessions[0]?._id,
			...gameResult,
			players: (await Promise.all(gameResult.players.map(player =>
				this.playersCollection.findOneAndUpdate(
					{ nickname: player.nickname },
					{ $set: { majsoulId: player.majsoulId } },
					{ upsert: true, returnOriginal: false, projection: { _id: true } }
				)
			))).map(p => p.value),
		};

		await this.gamesCollection.insertOne(gameRecord);
	}


	public contestCollection: Collection<Contest<ObjectId>>;
	public gamesCollection: Collection<GameResult<ObjectId>>;
	public playersCollection: Collection<Player<ObjectId>>;

	public async init(username: string, password: string): Promise<void> {
		const url = `mongodb://${username}:${password}@${process.env.MAJSOUL_ENV === "prod" ? 'majsoul_mongo' : 'localhost'}:27017/?authMechanism=SCRAM-SHA-256&authSource=admin`;
		const dbName = 'majsoul';
		const client = new MongoClient(url);
		try {
			await client.connect();
			console.log("Connected successfully to server");
			const db = client.db(dbName);

			this.contestCollection = await db.createCollection("contests", {});
			this.gamesCollection = await db.createCollection("games", {});
			this.playersCollection = await db.createCollection("players", {});
		} catch (e) {
			console.log(e);
		}
	}
}
