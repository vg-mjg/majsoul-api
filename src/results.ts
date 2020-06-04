import { Spreadsheet } from "./google";
import { MajsoulAPI } from "./majsoul";
import * as util from 'util';

function decodePaipuId(t) {
  for (var e = "", i = "0".charCodeAt(0), n = "a".charCodeAt(0), a = 0; a < t.length; a++) {
      var r = t.charAt(a),
          s = r.charCodeAt(0),
          o = -1;
      s >= i && s < i + 10 ? o = s - i : s >= n && s < n + 26 && (o = s - n + 10), e += -1 != o ? (o = (o + 55 - a) % 36) < 10 ? String.fromCharCode(o + i) : String.fromCharCode(o + n - 10) : r
  }
  return e
}

async function main() {
  const api = new MajsoulAPI();
  try {
    await api.init();
    const contest = await api.getContest(113331);
    console.log(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2"));
    console.log(util.inspect(await api.getGame(contest.games[1].id), false, null, true));
    console.log(util.inspect(await api.getGame("200527-2e1ccd3b-1318-41bf-a32d-97bec21f47da"), false, null, true));
    // const spreadsheet = new Spreadsheet();
    // await spreadsheet.init();
    // for (const game of contest.games) {
    //   if(spreadsheet.isGameRecorded(game.id)) {
    //     continue;
    //   }
    //   spreadsheet.addGame(await api.getGame(game.id));
    // }
  } finally {
    api.dispose();
  }
}

main();
