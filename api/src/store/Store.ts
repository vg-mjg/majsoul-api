import { Collection, MongoClient, ObjectId } from "mongodb";
import { Contest, GameResult, Player } from "./types/types";

export class Store {
	public contestCollection: Collection<Contest<ObjectId>>;
	public gamesCollection: Collection<GameResult<ObjectId>>;
	public playersCollection: Collection<Player<ObjectId>>;

	public async init(): Promise<void> {
		const url = 'mongodb://root:example@localhost:27017/?authMechanism=SCRAM-SHA-256&authSource=admin';
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