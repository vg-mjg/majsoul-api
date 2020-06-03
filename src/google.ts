import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GameResult } from './GameResult';

import * as env from './env';

export class Spreadsheet {
  private static readonly TOKEN_PATH = path.join(path.dirname(__filename), 'token.json');
  private static readonly spreadsheetId = '1F8aIK0EnliSrV3ME_DNtTzfHi488THMx-m5vhO2lPSk';

  private sheets: sheets_v4.Sheets;
  private spreadsheet: sheets_v4.Schema$Spreadsheet;
  private sheetId: number;
  private recordedGameIds: string[];

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
    this.sheetId = this.spreadsheet.sheets.find(s => s.properties.title === "Robots").properties.sheetId;
    const values = (await this.sheets.spreadsheets.values.get(
      {
        spreadsheetId: Spreadsheet.spreadsheetId,
        range: "Robots!A:A",
        valueRenderOption: 'UNFORMATTED_VALUE',
      }
    )).data;
    this.recordedGameIds = values.values.slice(1).map(v => v[0]).filter(v => isNaN(v));
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
            sheetId: this.sheetId,
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
            sheetId: this.sheetId,
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
          start: this.toGridCoord(0, 1),
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
          start: this.toGridCoord(0, 2),
          rows: game.playerResults.map((player, i) => {
            return {
              values: [
                { userEnteredValue: {
                  numberValue: game.time / (60*60*24) + 25569 },
                  userEnteredFormat: { numberFormat: { type: "DATE_TIME" } },
                },
                { userEnteredValue: { formulaValue: `=VLOOKUP(C${3 + i}; 'Ind. Ranking'!A:C; 3; FALSE)` } },
                { userEnteredValue: { stringValue: player.name } },
                { userEnteredValue: { numberValue: player.score } },
                { userEnteredValue: { numberValue: player.uma } },
                { userEnteredValue: { formulaValue: `=RANK(E${3 + i}; E3:E6)` } },
              ]
            }
          })
        }
      },
      {
        updateBorders: {
          range: {
            sheetId: this.sheetId,
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
            sheetId: this.sheetId,
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

  private toGridCoord(x: number, y: number): sheets_v4.Schema$GridCoordinate {
    return {
      sheetId: this.sheetId,
      columnIndex: x,
      rowIndex: y,
    }
  }
}
