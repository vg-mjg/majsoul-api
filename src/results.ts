import { Spreadsheet } from "./google";
import { MajsoulAPI } from "./majsoul";
import * as util from 'util';
import { Subscription } from "rxjs";

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
  const api = new MajsoulAPI();
  try {
    await api.init();
    console.log(api.majsoulCodec.decodeMessage(Buffer.from("0227000a282e6c712e4c6f6262792e6c65617665437573746f6d697a6564436f6e7465737443686174526f6f6d1200", "hex")));

    const contestId = await api.findContestUniqueId(113331);
    const contest2Id = await api.findContestUniqueId(917559);
    const games = await api.getContestGamesIds(contestId);
    const sub = api.subscribeToContest(contestId).subscribe(m => console.log(m));
    const sub2 = api.subscribeToContest(contest2Id).subscribe(m => console.log(m));

    sub.unsubscribe();

    const spreadsheet = new Spreadsheet();
    await spreadsheet.init();

    //spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));

    for (const game of games) {
      if(spreadsheet.isGameRecorded(game.id) && spreadsheet.isGameDetailRecorded(game.id)) {
        continue;
      }

      const gameResult = await api.getGame(game.id);

      if (gameResult.players.length < 4 || !gameResult.players.every(p => p.name))
        continue;

      spreadsheet.addGame(gameResult);
      spreadsheet.addGameDetails(gameResult);
    }
  } finally {
    //api.dispose();
  }
}

main();
