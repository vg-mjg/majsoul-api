import { sheets, sheets_v4 } from "@googleapis/sheets";
import { OAuth2Client } from "google-auth-library";
import { Han } from "majsoul";
import { ObjectId } from "mongodb";
import { Observable, Subject } from "rxjs";

import { DrawStatus,Wind } from "./store/enums.js";
import { ContestTeam } from "./store/types/contest/ContestTeam.js";
import { GameResult } from "./store/types/game/GameResult.js";
import { AgariInfo } from "./store/types/game/round/AgariInfo.js";
import { RoundInfo } from "./store/types/game/round/RoundInfo.js";
import { Player } from "./store/types/Player.js";

interface IHandDescription {
	round: RoundInfo;
	agari: AgariInfo;
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
	};

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
		this.sheets = sheets({version: "v4", auth: oAuth2Client});
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
				valueRenderOption: "UNFORMATTED_VALUE",
			}
		)).data;
		this.recordedGameIds = gameResultsIds.values?.slice(1).map(v => v[0]).filter(v => isNaN(v)) ?? [];
		const gameDetailsIds = (await this.sheets.spreadsheets.values.get(
			{
				spreadsheetId: this.spreadsheetId,
				range: `${Spreadsheet.gameDetailsSheetName}!A:A`,
				valueRenderOption: "UNFORMATTED_VALUE",
			}
		)).data;
		this.recordedGameDetailIds = gameDetailsIds.values?.slice(1).map(v => v[0]).filter(v => Object.values(Wind).indexOf(v) < 0) ?? [];
	}

	public isGameRecorded(id: string): boolean {
		return this.recordedGameIds.indexOf(id) >= 0;
	}

	public isGameDetailRecorded(id: string): boolean {
		return this.recordedGameDetailIds.indexOf(id) >= 0;
	}

	public addGame(game: GameResult<ObjectId>) {
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
						values: [
							undefined,
							{ userEnteredValue: {
								numberValue: game.end_time / (60*60*24*1000) + 25569 },
							userEnteredFormat: {numberFormat: { type: "DATE_TIME" }}
							},
							{ userEnteredValue: { formulaValue: `=VLOOKUP("${game.players[i]._id.toHexString()}"; 'Riichi Robots Teams'!A:C; 3; FALSE)` } },
							{ userEnteredValue: { numberValue: player.score } },
							{ userEnteredValue: { numberValue: player.uma / 1000} },
							{ userEnteredValue: { formulaValue: `=RANK(D${3 + i}; D3:D6)` } },
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

	public addGameDetails(game: GameResult<ObjectId>) {
		if (this.isGameDetailRecorded(game.majsoulId)) {
			console.log(`Game ${game.majsoulId} already recorded`);
			return;
		}

		this.recordedGameDetailIds.push(game.majsoulId);
		console.log(`Recording game details for game ${game.majsoulId}`);

		const hands: IHandDescription[] = game.rounds.filter(g => !g.draw || g.draw.playerDrawStatus.indexOf(DrawStatus.Nagashi_Mangan) >= 0)
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
					const winner = hand.draw.playerDrawStatus.indexOf(DrawStatus.Nagashi_Mangan);
					return [{
						round: hand.round,
						agari: {
							value: hand.round.dealership === winner ? 12000 : 8000,
							extras: 0,
							winner,
							han: [Han.Mangan_at_Draw]
						},
						result: "Draw"
					}];
				}
				return [{
					round: hand.round,
					agari: hand.tsumo,
					result: "Tsumo"
				}];
			}).flat();

		// hands.forEach(hand => {
		// 	console.log(`${Wind[hand.round.round]}${hand.round.dealership+1}.${hand.round.repeat} ${isNaN(hand.agari.winner) ? "" : game.players[hand.agari.winner].name} ${hand.result} ${hand.agari.value} + ${hand.agari.extras}`);
		// });

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
							{ userEnteredValue: { stringValue: Wind[hand.round.round] } },
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
									.map(kvp => `${Han[kvp[0]] || `Unknown(${kvp[0]})`}${kvp[1] > 1 ? ` ${kvp[1]}` : ""}`)
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

	public updateTeams(teams: ContestTeam<ObjectId>[], players: Record<string, Player<ObjectId>>) {
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
