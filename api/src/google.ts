import { google, sheets_v4 } from 'googleapis';
import * as majsoul from "./majsoul";
import * as store from "./store";
import { ObjectId } from 'mongodb';
import { OAuth2Client } from 'google-auth-library';
import { Observable, of, Subject } from 'rxjs';

interface IHandDescription {
	round: majsoul.RoundInfo;
	agari: majsoul.AgariInfo;
	result: string;
	loser?: number;
}

class DelayedChunkBuffer<T> {
	private queue: T[] = [];
	private timeOutId: NodeJS.Timeout;
	private readonly chunkSubject = new Subject<T[]>();

	constructor(
		private readonly capacity: number,
		private readonly delay: number
	) {}

	public get Chunks$(): Observable<T[]> {
		return this.chunkSubject;
	}

	public send(requests: T[]) {
		this.queue = this.queue.concat(requests);

		if (this.queue.length >= this.capacity) {
			const chunk = this.queue.slice(0, this.capacity);
			this.queue = this.queue.slice(this.capacity);
			this.chunkSubject.next(chunk);
		}

		if (this.timeOutId) {
			clearTimeout(this.timeOutId);
		}

		this.timeOutId = setTimeout(() => {
			this.timeOutId = null;
			const chunk = this.queue;
			this.queue = [];
			this.chunkSubject.next(chunk);
		}, this.delay);
	}
}

export class Spreadsheet {
	private static readonly blackBorderStyle = {
		style: "SOLID",
		color: {
			red: 0,
			green: 0,
			blue: 0,
			alpha: 1,
		}
	}

	private static readonly gameResultsSheetName = "Riichi Robots Games";
	private static readonly gameDetailsSheetName = "Riichi Robots Game Details";
	private static readonly teamsSheetName = "Riichi Robots Teams";

	private readonly sheets: sheets_v4.Sheets;
	private resultsSheetId: number;
	private detailsSheetId: number;
	private teamSheetId: number;
	private recordedGameIds: string[];
	private recordedGameDetailIds: string[];

	private readonly buffer = new DelayedChunkBuffer<sheets_v4.Schema$Request>(100, 2000);

	private uploadTask = Promise.resolve();

	constructor(
		public readonly spreadsheetId: string,
		oAuth2Client: OAuth2Client,
	) {
		this.sheets = google.sheets({version: 'v4', auth: oAuth2Client});
		this.buffer.Chunks$.subscribe((chunk) => {
			this.uploadTask = this.uploadTask
				.then(async () => {
					await this.sheets.spreadsheets.batchUpdate({
						spreadsheetId: this.spreadsheetId,
						requestBody: {
							requests: chunk
						}
					});
				})
				.catch();
		});
	}

	private async getSheetId(spreadsheet: sheets_v4.Schema$Spreadsheet, title: string): Promise<number> {
		const id = spreadsheet.sheets.find(s => s.properties.title === title)?.properties.sheetId;

		if (id != null) {
			return id;
		}

		const result = await this.sheets.spreadsheets.batchUpdate({
			spreadsheetId: this.spreadsheetId,
			requestBody: {
				requests: [
					{
						addSheet: {
							properties: {
								title: title
							}
						}
					}
				]
			}
		});
		return result.data.replies[0]?.addSheet?.properties?.sheetId;
	}

	public async init(): Promise<void>{
		const spreadsheet = (await (this.sheets.spreadsheets.get({
			spreadsheetId: this.spreadsheetId,
		}) as any as Promise<sheets_v4.Schema$Spreadsheet>) as any).data;
		this.resultsSheetId = await this.getSheetId(spreadsheet, Spreadsheet.gameResultsSheetName);
		this.detailsSheetId = await this.getSheetId(spreadsheet, Spreadsheet.gameDetailsSheetName);
		this.teamSheetId = await this.getSheetId(spreadsheet, Spreadsheet.teamsSheetName);

		const gameResultsIds = (await this.sheets.spreadsheets.values.get(
			{
				spreadsheetId: this.spreadsheetId,
				range: `${Spreadsheet.gameResultsSheetName}!A:A`,
				valueRenderOption: 'UNFORMATTED_VALUE',
			}
		)).data;
		this.recordedGameIds = gameResultsIds.values?.slice(1).map(v => v[0]).filter(v => isNaN(v)) ?? [];
		const gameDetailsIds = (await this.sheets.spreadsheets.values.get(
			{
				spreadsheetId: this.spreadsheetId,
				range: `${Spreadsheet.gameDetailsSheetName}!A:A`,
				valueRenderOption: 'UNFORMATTED_VALUE',
			}
		)).data;
		this.recordedGameDetailIds = gameDetailsIds.values?.slice(1).map(v => v[0]).filter(v => Object.values(majsoul.Wind).indexOf(v) < 0) ?? [];
	}

	public isGameRecorded(id: string): boolean {
		return this.recordedGameIds.indexOf(id) >= 0;
	}

	public isGameDetailRecorded(id: string): boolean {
		return this.recordedGameDetailIds.indexOf(id) >= 0;
	}

	public addGame(game: store.GameResult<ObjectId>) {
		if (this.isGameRecorded(game.majsoulId)) {
			console.log(`Game ${game.majsoulId} already recorded`);
			return;
		}

		this.recordedGameIds.push(game.majsoulId);
		console.log(`Recording game result for game ${game.majsoulId}`);

		const requests = [
			{
				insertDimension: {
					range: {
						sheetId: this.resultsSheetId,
						dimension: "ROWS",
						startIndex: 1,
						endIndex: 6,
					},
					inheritFromBefore: true
				}
			},
			{
				mergeCells: {
					range: {
						sheetId: this.resultsSheetId,
						startColumnIndex: 0,
						endColumnIndex: 7 + 88,
						startRowIndex: 1,
						endRowIndex: 2,
					}
				}
			},
			{
				updateCells: {
					fields: "*",
					start: {
						sheetId: this.resultsSheetId,
						columnIndex: 0,
						rowIndex: 1,
					},
					rows: [{
						values: [
							{
								userEnteredValue: { stringValue: game.majsoulId },
								userEnteredFormat: {
									horizontalAlignment: "LEFT",
									textFormat: {
										bold: true
									}
								}
							},
						]
					}]
				}
			},
			{
				updateCells: {
					fields: "*",
					start: {
						sheetId: this.resultsSheetId,
						columnIndex: 0,
						rowIndex: 2,
					},
					rows: game.finalScore.map((player, i) => ({
						values: [,
							{ userEnteredValue: {
								numberValue: game.end_time / (60*60*24*1000) + 25569 },
								userEnteredFormat: {numberFormat: { type: "DATE_TIME" }}
							},
							{ userEnteredValue: { formulaValue: `=VLOOKUP("${game.players[i]._id.toHexString()}"; 'Riichi Robots Teams'!A:C; 3; FALSE)` } },
							{ userEnteredValue: { numberValue: player.score } },
							{ userEnteredValue: { numberValue: player.uma / 1000} },
							{ userEnteredValue: { formulaValue: `=RANK(D${3 + i}; D3:D6)` } },
							{ userEnteredValue: { numberValue: game.stats[i].nhands } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.total } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.daburiichi } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.furiten } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.sticks_kept } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.sticks_won } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.first } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.chase } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.chased } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.ippatsu } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.ura_hit } },
							{ userEnteredValue: { numberValue: game.stats[i].riichi.immediate_dealin } },
							{ userEnteredValue: { numberValue: game.stats[i].dealer.rounds } },
							{ userEnteredValue: { numberValue: game.stats[i].dealer.tsumo_hit } },
							{ userEnteredValue: { numberValue: game.stats[i].dealer.tsumo_hit_points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealer.tsumo_hit_mangan } },
							{ userEnteredValue: { numberValue: game.stats[i].dealer.tsumo_hit_mangan_points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealer.repeats } },
							{ userEnteredValue: { numberValue: game.stats[i].dealer.max_repeats } },
							{ userEnteredValue: { numberValue: game.stats[i].calls.opened_hands } },
							{ userEnteredValue: { numberValue: game.stats[i].calls.total } },
							{ userEnteredValue: { numberValue: game.stats[i].calls.opps } },
							{ userEnteredValue: { numberValue: game.stats[i].calls.opps_all } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.total } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.points } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.yakuman } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.open.points } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.open.total } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.open.ron } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.open.tsumo } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.uradora } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.akadora } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.dora } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.riichi.points } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.riichi.total } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.riichi.ron } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.riichi.tsumo } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.dama.points } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.dama.total } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.dama.ron } },
							{ userEnteredValue: { numberValue: game.stats[i].wins.dama.tsumo } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.yakuman } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.open.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.open.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.uradora } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.akadora } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.dora } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.riichi.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.riichi.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.dama.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins.dama.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.yakuman } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.open.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.open.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.uradora } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.akadora } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.dora } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.riichi.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.riichi.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.dama.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_riichi.dama.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.yakuman } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.open.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.open.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.uradora } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.akadora } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.dora } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.riichi.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.riichi.points } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.dama.total } },
							{ userEnteredValue: { numberValue: game.stats[i].dealins_while_open.dama.points } },
							{ userEnteredValue: { numberValue: game.stats[i].draws.total } },
							{ userEnteredValue: { numberValue: game.stats[i].draws.points } },
							{ userEnteredValue: { numberValue: game.stats[i].draws.ten } },
							{ userEnteredValue: { numberValue: game.stats[i].draws.open } },
							{ userEnteredValue: { numberValue: game.stats[i].draws.riichi } },
							{ userEnteredValue: { numberValue: game.stats[i].draws.nagashi } },
							{ userEnteredValue: { numberValue: game.stats[i].turns.total } },
							{ userEnteredValue: { numberValue: game.stats[i].turns.riichi } },
							{ userEnteredValue: { numberValue: game.stats[i].turns.win } },
							{ userEnteredValue: { numberValue: game.stats[i].turns.dealin } },
							{ userEnteredValue: { numberValue: game.stats[i].shanten } },
						]
					}))
				}
			},
			{
				updateBorders: {
					range: {
						sheetId: this.resultsSheetId,
						startColumnIndex: 0,
						endColumnIndex: 7 + 88,
						startRowIndex: 1,
						endRowIndex: 6,
					},
					top: Spreadsheet.blackBorderStyle,
					right: Spreadsheet.blackBorderStyle,
					left: Spreadsheet.blackBorderStyle,
					bottom: Spreadsheet.blackBorderStyle,
				}
			},
			{
				updateBorders: {
					range: {
						sheetId: this.resultsSheetId,
						startColumnIndex: 0,
						endColumnIndex: 6,
						startRowIndex: 1,
						endRowIndex: 2,
					},
					bottom: Spreadsheet.blackBorderStyle,
				}
			}
		];

		this.buffer.send(requests);
	}

	public addGameDetails(game: store.GameResult<ObjectId>) {
		if (this.isGameDetailRecorded(game.majsoulId)) {
			console.log(`Game ${game.majsoulId} already recorded`);
			return;
		}

		this.recordedGameDetailIds.push(game.majsoulId);
		console.log(`Recording game details for game ${game.majsoulId}`);

		const hands: IHandDescription[] = game.rounds.filter(g => !g.draw || g.draw.playerDrawStatus.indexOf(majsoul.DrawStatus.Nagashi_Mangan) >= 0)
			.map(hand => {
				if (hand.rons) {
					return hand.rons.map(r => (
						{
							round: hand.round,
							agari: r,
							loser: r.loser,
							result: "Ron"
						}
					));
				}
				if (hand.draw) {
					const winner = hand.draw.playerDrawStatus.indexOf(majsoul.DrawStatus.Nagashi_Mangan);
					return [{
						round: hand.round,
						agari: {
							value: hand.round.dealership === winner ? 12000 : 8000,
							extras: 0,
							winner,
							han: [majsoul.Han.Mangan_at_Draw]
						},
						result: "Draw"
					}]
				}
				return [{
					round: hand.round,
					agari: hand.tsumo,
					result: "Tsumo"
				}]
			}).flat();

		hands.forEach(hand => {
			//console.log(`${Wind[hand.round.round]}${hand.round.dealership+1}.${hand.round.repeat} ${isNaN(hand.agari.winner) ? "" : game.players[hand.agari.winner].name} ${hand.result} ${hand.agari.value} + ${hand.agari.extras}`);
		})

		const requests: sheets_v4.Schema$Request[] = [
			{
				insertDimension: {
					range: {
						sheetId: this.detailsSheetId,
						dimension: "ROWS",
						startIndex: 1,
						endIndex: 1 + 1 + hands.length,
					},
					inheritFromBefore: true
				}
			},
			{
				mergeCells: {
					range: {
						sheetId: this.detailsSheetId,
						startColumnIndex: 1,
						endColumnIndex: 8,
						startRowIndex: 1,
						endRowIndex: 2,
					}
				}
			},
			{
				updateCells: {
					fields: "*",
					start: {
						sheetId: this.detailsSheetId,
						columnIndex: 0,
						rowIndex: 1,
					},
					rows: [{
						values: [
							{
								userEnteredValue: { stringValue: game.majsoulId },
							},
							{
								userEnteredValue: { stringValue: game.players.map(p => p._id.toHexString()).join(", ") },
								userEnteredFormat: {
									horizontalAlignment: "CENTER",
									textFormat: {
										bold: true
									}
								}
							}
						]
					}]
				}
			},
			{
				updateCells: {
					fields: "*",
					start: {
						sheetId: this.detailsSheetId,
						columnIndex: 8,
						rowIndex: 1,
					},
					rows: [{
						values: [
							{ userEnteredValue: {
								numberValue: game.end_time / (60*60*24*1000) + 25569 },
								userEnteredFormat: {
									horizontalAlignment: "LEFT",
									textFormat: { bold: true },
									numberFormat: { type: "DATE_TIME" }
								}
							}
						]
					}]
				}
			},
			{
				updateCells: {
					fields: "*",
					start: {
						sheetId: this.detailsSheetId,
						columnIndex: 0,
						rowIndex: 2,
					},
					rows: hands.map((hand) => ({
						values: [
							{ userEnteredValue: { stringValue: majsoul.Wind[hand.round.round] } },
							{ userEnteredValue: { numberValue: hand.round.dealership + 1 } },
							{ userEnteredValue: { numberValue: hand.round.repeat } },
							{ userEnteredValue: { stringValue: hand.result } },
							{ userEnteredValue: {
								formulaValue: `=VLOOKUP("${game.players[hand.agari.winner]._id}"; 'Riichi Robots Teams'!A:C; 3; FALSE)`
							} },
							{ userEnteredValue: { numberValue: hand.agari.value + hand.agari.extras } },
							{ userEnteredValue: { numberValue: hand.agari.value + hand.round.repeat * 300 } },
							{ userEnteredValue: {
								formulaValue: hand.loser == null
									? null
									: `=VLOOKUP("${game.players[hand.loser]._id}"; 'Riichi Robots Teams'!A:C; 3; FALSE)`
							} },
							{ userEnteredValue: {
								stringValue: Object.entries(hand.agari.han.reduce((map, next) => {
										map[next] = (map[next] || 0) + 1;
										return map;
									}, {}))
										.map(kvp => `${majsoul.Han[kvp[0]] || `Unknown(${kvp[0]})`}${kvp[1] > 1 ? ` ${kvp[1]}` : ""}`)
										.map(h => h.replace(/_/g, " "))
										.join(", ")
								}
							},
						]
					})).flat()
				}
			},
			{
				updateBorders: {
					range: {
						sheetId: this.detailsSheetId,
						startColumnIndex: 0,
						endColumnIndex: 9,
						startRowIndex: 1,
						endRowIndex: 1 + 1 + hands.length,
					},
					top: Spreadsheet.blackBorderStyle,
					right: Spreadsheet.blackBorderStyle,
					left: Spreadsheet.blackBorderStyle,
					bottom: Spreadsheet.blackBorderStyle,
				}
			},
			{
				updateBorders: {
					range: {
						sheetId: this.detailsSheetId,
						startColumnIndex: 0,
						endColumnIndex: 9,
						startRowIndex: 1,
						endRowIndex: 2,
					},
					bottom: Spreadsheet.blackBorderStyle,
				}
			}
		];

		this.buffer.send(requests);
	}

	public updateTeams(teams: store.ContestTeam<ObjectId>[], players: Record<string, store.Player<ObjectId>>) {
		const requests: sheets_v4.Schema$Request[] = [
			{
				insertDimension: {
					range: {
						sheetId: this.teamSheetId,
						dimension: "ROWS",
						startIndex: 0,
						endIndex: 1,
					}
				},
			},
			{
				deleteDimension: {
					range: {
						sheetId: this.teamSheetId,
						dimension: "ROWS",
						startIndex: 1,
					}
				},
			},
			...teams.map<sheets_v4.Schema$Request[]>(team => [
				{
					insertDimension: {
						range: {
							sheetId: this.teamSheetId,
							dimension: "ROWS",
							startIndex: 0,
							endIndex: team.players.length,
						}
					},
				},
				{
					updateCells: {
						fields: "*",
						start: {
							sheetId: this.teamSheetId,
							columnIndex: 0,
							rowIndex: 0,
						},
						rows: team.players.map((player) => {
							const id = player._id.toHexString();
							const playerRecord = players[id];
							return {
								values: [
									{ userEnteredValue: { stringValue: id } },
									{ userEnteredValue: { stringValue: team.name } },
									{ userEnteredValue: { stringValue: playerRecord.displayName ?? playerRecord.nickname } },
								]
							};
						})
					}
				}
			]).flat()
		];

		this.buffer.send(requests);
	}
}
