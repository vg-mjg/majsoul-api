import { Spreadsheet } from "./google";
import { MajsoulApi } from "./majsoul";
import { majsoul } from "./env";

function decodePaipuId(paipu: string): string {
  for (var e = "", i = "0".charCodeAt(0), n = "a".charCodeAt(0), a = 0; a < paipu.length; a++) {
      var r = paipu.charAt(a),
          s = r.charCodeAt(0),
          o = -1;
      s >= i && s < i + 10 ? o = s - i : s >= n && s < n + 26 && (o = s - n + 10), e += -1 != o ? (o = (o + 55 - a) % 36) < 10 ? String.fromCharCode(o + i) : String.fromCharCode(o + n - 10) : r;
  }
  return e;
}

async function main() {
  async function addToSpreadSheet(gameId): Promise<void> {
    if(spreadsheet.isGameRecorded(gameId) && spreadsheet.isGameDetailRecorded(gameId)) {
      return;
    }

    let gameResult;
    for(let retries = 0; retries < 3; retries++) {
      gameResult = await api.getGame(gameId);
      if (gameResult != null) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (gameResult == null){
      console.log(`Unable to retrieve game ${gameId}, skipping spreadsheet add`);
      return;
    }

    if (gameResult.players.length < 4 || !gameResult.players.every(p => p.name)) {
      return;
    }

    spreadsheet.addGame(gameResult);
    spreadsheet.addGameDetails(gameResult);
  }

  const spreadsheet = new Spreadsheet();
  await spreadsheet.init();

  const api = new MajsoulApi(await MajsoulApi.retrieveMahjsoulApiResources());
  await api.init();
  await api.logIn(majsoul.uid, majsoul.accessToken);

  //console.log(api.majsoulCodec.decodeMessage(Buffer.from("0227000a282e6c712e4c6f6262792e6c65617665437573746f6d697a6564436f6e7465737443686174526f6f6d1200", "hex")));

  const contestId = await api.findContestUniqueId(113331);
  // const contest2Id = await api.findContestUniqueId(917559);
  const sub = api.subscribeToContestChatSystemMessages(contestId).subscribe(notification => {
    if (notification.game_end && notification.game_end.constructor.name === "CustomizedContestGameEnd") {
      setTimeout(() => addToSpreadSheet(notification.uuid), 6000);
    }
  });


  //spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));

  const games = await api.getContestGamesIds(contestId);
  games.forEach((game) => addToSpreadSheet(game.id));
}

main();
