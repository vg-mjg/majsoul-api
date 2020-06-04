import { Spreadsheet } from "./google";
import { MajsoulAPI } from "./majsoul";

async function main() {
  const api = new MajsoulAPI();
  try {
    await api.init();
    const contest = await api.getContest(113331);
    console.log(await api.getGame(contest.games[1].id));
    console.log(await api.getGame("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2"));
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
