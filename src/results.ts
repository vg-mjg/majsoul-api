import { Spreadsheet } from "./google";
import { MajsoulAPI } from "./majsoul";
import * as util from 'util';

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
    const spreadsheet = new Spreadsheet();
    await spreadsheet.init();

    const contest = await api.getContest(113331);
    spreadsheet.addGameDetails(await api.getGame(contest.games[1].id));
    spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));

    for (const game of contest.games) {
      if(spreadsheet.isGameRecorded(game.id)) {
        continue;
      }
      spreadsheet.addGame(await api.getGame(game.id));
    }
  } finally {
    api.dispose();
  }
}

main();
