import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GameResult } from './GameResult';

import * as env from './env';
import { DrawStatus, IRoundInfo, IAgariInfo, Wind } from './IHandRecord';
import { Han } from './Han';

interface IHandDescription {
  round: IRoundInfo;
  agari: IAgariInfo;
  result: string;
  loser?: number;
}

export class Spreadsheet {
  private static readonly TOKEN_PATH = path.join(path.dirname(__filename), 'token.json');
  private static readonly spreadsheetId = '1F8aIK0EnliSrV3ME_DNtTzfHi488THMx-m5vhO2lPSk';
  private static readonly gameResultsSheetName = "Robots";
  private static readonly gameDetailsSheetName = "Details";

  private sheets: sheets_v4.Sheets;
  private spreadsheet: sheets_v4.Schema$Spreadsheet;
  private resultsSheetId: number;
  private detailsSheetId: number;
  private recordedGameIds: string[];
  private recordedGameDetailIds: string[];

  public async init(): Promise<void>{
    const auth = await new Promise<any>((resolve) => {
      const {client_secret, client_id, redirect_uris} = env.googleCreds.installed;
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      fs.readFile(Spreadsheet.TOKEN_PATH, (err, token) => {
        if (err) {
          return this.getNewToken(oAuth2Client, (auth: OAuth2Client) => resolve(auth));
        }
        oAuth2Client.setCredentials(JSON.parse(token as any));
        resolve(oAuth2Client);
      });
    });

    this.sheets = google.sheets({version: 'v4', auth: auth});
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
    this.recordedGameIds = gameResultsIds.values.slice(1).map(v => v[0]).filter(v => isNaN(v));
    const gameDetailsIds = (await this.sheets.spreadsheets.values.get(
      {
        spreadsheetId: Spreadsheet.spreadsheetId,
        range: `${Spreadsheet.gameDetailsSheetName}!A:A`,
        valueRenderOption: 'UNFORMATTED_VALUE',
      }
    )).data;
    this.recordedGameDetailIds = gameDetailsIds.values.slice(1).map(v => v[0]).filter(v => Object.values(Wind).indexOf(v) < 0);
  }

  private getNewToken(oAuth2Client, callback) {
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
        oAuth2Client.setCredentials(token);
        fs.writeFile(Spreadsheet.TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', Spreadsheet.TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }

  public isGameRecorded(id: string): boolean {
    return this.recordedGameIds.indexOf(id) >= 0;
  }

  public isGameDetailRecorded(id: string): boolean {
    return this.recordedGameDetailIds.indexOf(id) >= 0;
  }

  public async addGame(game: GameResult) {
    if (this.isGameRecorded(game.id)) {
      console.log(`Game ${game.id} already recorded`);
      return;
    }

    this.recordedGameIds.push(game.id);

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
                userEnteredValue: { stringValue: game.id },
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
            values: [
              { userEnteredValue: {
                numberValue: game.time / (60*60*24) + 25569 },
                userEnteredFormat: { numberFormat: { type: "DATE_TIME" } },
              },
              { userEnteredValue: { formulaValue: `=VLOOKUP(C${3 + i}; 'Ind. Ranking'!A:C; 3; FALSE)` } },
              { userEnteredValue: { stringValue: game.players[i].name } },
              { userEnteredValue: { numberValue: player.score } },
              { userEnteredValue: { numberValue: player.uma } },
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

  public async addGameDetails(game: GameResult) {
    if (this.isGameDetailRecorded(game.id)) {
      console.log(`Game ${game.id} already recorded`);
      return;
    }

    this.recordedGameDetailIds.push(game.id);

    const blackBorderStyle = {
      style: "SOLID",
      color: {
        red: 0,
        green: 0,
        blue: 0,
        alpha: 1,
      }
    }

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
              winner,
              han: [Han.Mangan_at_Draw]
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
            startColumnIndex: 0,
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
                userEnteredValue: { stringValue: game.id },
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
            sheetId: this.detailsSheetId,
            columnIndex: 0,
            rowIndex: 2,
          },
          rows: hands.map((hand) => ({
            values: [
              { userEnteredValue: { stringValue: Wind[hand.round.round] } },
              { userEnteredValue: { stringValue: Wind[hand.round.dealership] } },
              { userEnteredValue: { numberValue: hand.round.repeat } },
              { userEnteredValue: { stringValue: hand.result } },
              { userEnteredValue: { stringValue: game.players[hand.agari.winner].name } },
              { userEnteredValue: { numberValue: hand.agari.value } },
              { userEnteredValue: { stringValue: hand.loser == null ? "" : game.players[hand.loser].name } },
              { userEnteredValue: {
                stringValue: Object.entries(hand.agari.han.reduce((map, next) => {
                    map[next] = (map[next] || 0) + 1;
                    return map;
                  }, {}))
                    .map(kvp => `${kvp[1] > 1 ? kvp[1] + "x" : ""}${Han[kvp[0]] || kvp[0]}`)
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
            endColumnIndex: 8,
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
            endColumnIndex: 8,
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
