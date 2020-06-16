import * as express from 'express';
import * as cors from "cors";
import * as store from '../store';
import { Contest } from './types/types';
import { ObjectId, FilterQuery } from 'mongodb';

export class RestApi {
	private app: express.Express;

	constructor(private readonly mongoStore: store.Store) {
		this.app = express();
		this.app.use(cors());

		this.app.get<any, Contest<ObjectId>>('/contests/:id', (req, res) => {
			this.mongoStore.contestCollection.findOne(
				{ majsoulFriendlyId: parseInt(req.params.id) }
			).then(async (contest) => {
				res.send({
					...contest,
					sessions: await Promise.all(contest.sessions.map(async (session) => ({
						...session,
						totals: await this.getSessionSummary(contest, session)
					})))
				});
			})
			.catch(error => {
				console.log(error);
				res.status(500).send(error)
			});
		});

		this.app.get('/games', (req, res) => {
			const filter: FilterQuery<store.GameResult<ObjectId>> = {};

			const sessionIds = (req.query?.sessions as string)?.split(' ');
			if (sessionIds) {
				console.log(sessionIds);
				filter.sessionId = { $in: sessionIds.map(id => new ObjectId(id)) };
			}

			const cursor = this.mongoStore.gamesCollection.find(filter);

			if (req.query?.last) {
				const last = parseInt(req.query.last as string);
				if (last) {
					cursor.sort({end_time: -1})
					.limit(last);
				}
			}

			cursor.toArray()
				.then(games => res.send(games))
				.catch(error => {
					console.log(error);
					res.status(500).send(error)
				});
		});
	}

	private async getSessionSummary(contest: store.Contest, session: store.Session): Promise<Record<string, number>> {
		const games = await this.mongoStore.gamesCollection.find({
			sessionId: session._id
		}).toArray();
		return games.reduce<Record<string, number>>((total, game) => {
			game.finalScore.forEach((score, index) => {
				const winningTeam = contest.teams.find(t => t.players.find(p => p._id.equals(game.players[index]._id)));
				if(!winningTeam) {
					console.log(session._id);
					console.log(game);
				}
				total[winningTeam._id.toHexString()] = (total[winningTeam._id.toHexString()] ?? 0) + score.uma;
			});
			return total;
		}, {});
	}

	public init() {
		this.app.listen(9515, () => console.log(`Express started`));
	}
}