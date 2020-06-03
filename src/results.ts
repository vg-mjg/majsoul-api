import { Spreadsheet } from "./google";
import { MajsoulAPI } from "./majsoul";

async function main() {
  const api = new MajsoulAPI();
  try {
    await api.init();
    const contest = await api.getContest(113331);

    const spreadsheet = new Spreadsheet();
    await spreadsheet.init();
    for (const game of contest.games) {
      spreadsheet.addGame(await api.getGame(game.id));
    }
  } finally {
    api.dispose();
  }
}

main();
