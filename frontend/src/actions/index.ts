import { ContestCreatedAction } from "./contests/ContestCreatedAction";
import { ContestPatchedAction } from "./contests/ContestPatchedAction";
import { ContestsIndexRetrievedAction } from "./contests/ContestsIndexRetrievedAction";
import { ContestSummaryRetrievedAction } from "./contests/ContestSummaryRetrievedAction";
import { GamesRetrievedAction } from "./games/GamesRetrievedAction";
import { ContestPlayersRetrievedAction } from "./players/ContestPlayersRetrievedAction";
import { LogOutAction } from "./rigging/LoggedOutAction";
import { RiggingTokenAcquired } from "./rigging/RiggingTokenAcquired";
import { ContestSessionsRetrievedAction } from "./sessions/ContestSessionsRetrievedAction";
import { SessionPatchedAction } from "./sessions/ContestSessionsRetrievedAction copy";
import { TeamCreatedAction } from "./teams/TeamCreatedAction";
import { TeamDeletedAction } from "./teams/TeamDeletedAction";
import { TeamPatchedAction } from "./teams/TeamPatchedAction";

export { ActionType } from "./ActionType";

export type MajsoulAction = ContestSummaryRetrievedAction
| GamesRetrievedAction
| RiggingTokenAcquired
| TeamPatchedAction
| ContestSessionsRetrievedAction
| SessionPatchedAction
| ContestPlayersRetrievedAction
| ContestPlayersRetrievedAction
| ContestsIndexRetrievedAction
| ContestCreatedAction
| ContestPatchedAction
| LogOutAction
| TeamCreatedAction
| TeamDeletedAction;
