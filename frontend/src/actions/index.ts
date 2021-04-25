import { SummaryRetrievedAction, SessionGamesRetrieved, SessionPatched, GetContestSessions, GetContestPlayers, GetContestPlayerGames, GetContests, CreateContest, ContestPatched } from "./Actions";
import { LogOutAction } from "./LoggedOutAction";
import { RiggingTokenAcquired } from "./RiggingTokenAcquired";
import { TeamCreatedAction } from "./TeamCreatedAction";
import { TeamDeletedAction } from "./TeamDeletedAction";
import { TeamPatchedAction } from "./TeamPatchedAction";
export { ActionType } from "./ActionType";

export type MajsoulAction = SummaryRetrievedAction
| SessionGamesRetrieved
| RiggingTokenAcquired
| SessionPatched
| TeamPatchedAction
| GetContestSessions
| GetContestPlayers
| GetContestPlayerGames
| GetContests
| CreateContest
| ContestPatched
| LogOutAction
| TeamCreatedAction
| TeamDeletedAction;
