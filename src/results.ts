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

    console.log(api.majsoulCodec.decodeMessage(Buffer.from("010a202e6c712e4e6f74696679437573746f6d436f6e7465737453797374656d4d7367127608a21810021a2b3230303630342d39633433373731362d313735362d346233632d623238632d6463333138303637666338372a420a130899b3a3391208686965726172636818f48d050a0d080018a490ffffffffffffff010a0d080018a4acfeffffffffffff010a0d080018c4b5fdffffffffffff01", "hex")));
    return;
    const spreadsheet = new Spreadsheet();
    await spreadsheet.init();

    const contest = await api.getContest(113331);
    console.log(util.inspect(await api.getGame(contest.games[contest.games.length-1].id), false, null, true));

    return;
    spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));

    for (const game of contest.games) {
      if(spreadsheet.isGameRecorded(game.id) && spreadsheet.isGameDetailRecorded(game.id)) {
        continue;
      }
      const gameResult = await api.getGame(game.id);
      spreadsheet.addGame(gameResult);
      spreadsheet.addGameDetails(gameResult);
    }
  } finally {
    api.dispose();
  }
}

main();
