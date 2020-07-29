import * as readline from 'readline';
import { google, sheets_v4 } from 'googleapis';
import { Credentials } from 'google-auth-library';
import * as majsoul from "./majsoul";
import * as store from "./store";
import { ObjectId } from 'mongodb';

interface IHandDescription {
	round: majsoul.RoundInfo;
	agari: majsoul.AgariInfo;
	result: string;
	loser?: number;
}

export interface IGoogleAppInformation {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	authToken: Credentials;
}

export class Spreadsheet {
	private static readonly spreadsheetId = '13C5gq2Duf82M1UUX76cUhAjlyL_ogzNkgQjqMbF6TRs';
	private static readonly gameResultsSheetName = "Robots";
	private static readonly gameDetailsSheetName = "Details";

	public static getAuthTokenInteractive(appInformation: IGoogleAppInformation): Promise<Credentials> {
		return new Promise<Credentials>(resolve => {
			const oAuth2Client = new google.auth.OAuth2(
				appInformation.clientId,
				appInformation.clientSecret,
				appInformation.redirectUri
			);

			const authUrl = oAuth2Client.generateAuthUrl({
				access_type: 'offline',
				scope: ['https://www.googleapis.com/auth/spreadsheets'],
			});

			console.log('Authorize this app by visiting this url:', authUrl);
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});

			rl.question('Enter the code from that page here: ', (code) => {
				rl.close();
				oAuth2Client.getToken(code, (err, token) => {
					if (err) return console.error('Error while trying to retrieve access token', err);
					resolve(token as any);
				});
			});
		});
	}

	private readonly sheets: sheets_v4.Sheets;
	private spreadsheet: sheets_v4.Schema$Spreadsheet;
	private resultsSheetId: number;
	private detailsSheetId: number;
	private recordedGameIds: string[];
	private recordedGameDetailIds: string[];

	constructor(appInformation: IGoogleAppInformation) {
		const oAuth2Client = new google.auth.OAuth2(
			appInformation.clientId,
			appInformation.clientSecret,
			appInformation.redirectUri
		);

		oAuth2Client.setCredentials(appInformation.authToken);
		this.sheets = google.sheets({version: 'v4', auth: oAuth2Client});
	}

	public async init(): Promise<void>{
		this.spreadsheet = (await (this.sheets.spreadsheets.get({
			spreadsheetId: Spreadsheet.spreadsheetId,
		}) as any as Promise<sheets_v4.Schema$Spreadsheet>) as any).data;
		this.resultsSheetId = this.spreadsheet.sheets.find(s => s.properties.title === Spreadsheet.gameResultsSheetName).properties.sheetId;
		this.detailsSheetId = this.spreadsheet.sheets.find(s => s.properties.title === Spreadsheet.gameDetailsSheetName).properties.sheetId;
		const gameResultsIds = (await this.sheets.spreadsheets.values.get(
			{
				spreadsheetId: Spreadsheet.spreadsheetId,
				range: `${Spreadsheet.gameResultsSheetName}!A:A`,
				valueRenderOption: 'UNFORMATTED_VALUE',
			}
		)).data;
		this.recordedGameIds = gameResultsIds.values?.slice(1).map(v => v[0]).filter(v => isNaN(v)) ?? [];
		const gameDetailsIds = (await this.sheets.spreadsheets.values.get(
			{
				spreadsheetId: Spreadsheet.spreadsheetId,
				range: `${Spreadsheet.gameDetailsSheetName}!A:A`,
				valueRenderOption: 'UNFORMATTED_VALUE',
			}
		)).data;
		this.recordedGameDetailIds = gameDetailsIds.values?.slice(1).map(v => v[0]).filter(v => Object.values(majsoul.Wind).indexOf(v) < 0) ?? [];
	}

	public async getTeamInformation(): Promise<store.ContestTeam<ObjectId>[]> {
		const players = (await this.sheets.spreadsheets.values.get(
			{
				spreadsheetId: Spreadsheet.spreadsheetId,
				range: `'Ind. Ranking'!A:C`
			}
		)).data;
		const teams: store.ContestTeam<ObjectId>[] = [];
		for(const row of players.values.slice(1)) {
			if (row[0] === "") {
				if (row[2] === "T#") {
					continue;
				}
				teams.push({
					anthem: undefined,
					image: undefined,
					name: row[2],
					players: [],
					_id: undefined,
					color: undefined
				});
				continue;
			}
			teams[teams.length - 1].players.push({
				_id: undefined,
				majsoulId: undefined,
				displayName: row[1],
				nickname: row[0],
			});
		}
		return teams;
	}

	public async getMatchInformation(teams: store.ContestTeam<ObjectId>[]): Promise<store.Session<ObjectId>[]> {
		const teamsArray = (await this.sheets.spreadsheets.values.get(
			{
				spreadsheetId: Spreadsheet.spreadsheetId,
				majorDimension: "COLUMNS",
				range: `'Team Score Graph'!C39:C48`
			}
		)).data.values[0].map(name => ({
			_id: teams.find(team => team.name === name)._id,
		}));

		const schedule = (await this.sheets.spreadsheets.values.get(
			{
				spreadsheetId: Spreadsheet.spreadsheetId,
				majorDimension: "COLUMNS",
				range: `'Schedule'!B17:O76`
			}
		)).data.values;

		let date = Date.UTC(2020, 4, 26, 18);
		const matches: store.Session<ObjectId>[] = [];
		const day = 1000 * 60 * 60 * 24;
		const sixHours = 1000 * 60 * 60 * 6;
		const intervals = [day, day, day + sixHours, day - sixHours, sixHours, day - sixHours, day * 2]
		for(let week = 0; week < 5; week++) {
			for(let slot = 0; slot < 7; slot++) {
				matches.push({
					_id: undefined,
					contestId: undefined,
					scheduledTime: matches.length === 14 ? date + day * 6 : date,
					isCancelled: schedule[slot * 2][13 * week] === "Cancelled",
					plannedMatches: [
						{
							teams: schedule[slot * 2]
								.slice(4 + 13 * week, 4 + 13 * week + 4)
								.map(index => teamsArray[index - 1]),
						},
						{
							teams: schedule[slot * 2 + 1]
								.slice(4 + 13 * week, 4 + 13 * week + 4)
								.map(index => teamsArray[index - 1]),
						}
					]
				})
				date += intervals[0];
				intervals.push(intervals.shift());
			}
		}

		return matches.sort((a, b) => b.scheduledTime - a.scheduledTime);
	}

	public isGameRecorded(id: string): boolean {
		return this.recordedGameIds.indexOf(id) >= 0;
	}

	public isGameDetailRecorded(id: string): boolean {
		return this.recordedGameDetailIds.indexOf(id) >= 0;
	}

	public async addGame(game: majsoul.GameResult) {
		if (this.isGameRecorded(game.majsoulId)) {
			console.log(`Game ${game.majsoulId} already recorded`);
			return;
		}

		this.recordedGameIds.push(game.majsoulId);
		console.log(`Recording game result for game ${game.majsoulId}`);

		const blackBorderStyle = {
			style: "SOLID",
			color: {
				red: 0,
				green: 0,
				blue: 0,
				alpha: 1,
			}
		}

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
						endColumnIndex: 6,
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
									horizontalAlignment: "CENTER",
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
							{ userEnteredValue: { formulaValue: `=VLOOKUP(C${3 + i}; 'Ind. Ranking'!A:C; 3; FALSE)` } },
							{ userEnteredValue: { stringValue: game.players[i].nickname } },
							{ userEnteredValue: { numberValue: player.score } },
							{ userEnteredValue: { numberValue: player.uma / 1000} },
							{ userEnteredValue: { formulaValue: `=RANK(E${3 + i}; E3:E6)` } },
						]
					}))
				}
			},
			{
				updateBorders: {
					range: {
						sheetId: this.resultsSheetId,
						startColumnIndex: 0,
						endColumnIndex: 6,
						startRowIndex: 1,
						endRowIndex: 6,
					},
					top: blackBorderStyle,
					right: blackBorderStyle,
					left: blackBorderStyle,
					bottom: blackBorderStyle,
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
					bottom: blackBorderStyle,
				}
			}
		];

		await this.sheets.spreadsheets.batchUpdate({
			spreadsheetId: Spreadsheet.spreadsheetId,
			requestBody: {
				requests
			}
		});
	}

	public async addGameDetails(game: majsoul.GameResult) {
		if (this.isGameDetailRecorded(game.majsoulId)) {
			console.log(`Game ${game.majsoulId} already recorded`);
			return;
		}

		this.recordedGameDetailIds.push(game.majsoulId);
		console.log(`Recording game details for game ${game.majsoulId}`);

		const blackBorderStyle = {
			style: "SOLID",
			color: {
				red: 0,
				green: 0,
				blue: 0,
				alpha: 1,
			}
		}

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
								userEnteredValue: { stringValue: game.players.map(p => p.nickname).join(", ") },
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
							{ userEnteredValue: { stringValue: game.players[hand.agari.winner].nickname } },
							{ userEnteredValue: { numberValue: hand.agari.value + hand.agari.extras } },
							{ userEnteredValue: { numberValue: hand.agari.value + hand.round.repeat * 300 } },
							{ userEnteredValue: { stringValue: hand.loser == null ? "" : game.players[hand.loser].nickname } },
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
					top: blackBorderStyle,
					right: blackBorderStyle,
					left: blackBorderStyle,
					bottom: blackBorderStyle,
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
					bottom: blackBorderStyle,
				}
			}
		];

		await this.sheets.spreadsheets.batchUpdate({
			spreadsheetId: Spreadsheet.spreadsheetId,
			requestBody: {
				requests
			}
		});
	}
}
