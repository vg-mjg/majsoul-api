import { AILevel } from "majsoul-api/dist/majsoul/types";
import { Contest } from "src/State";

export function levelToString(aiLevel: AILevel): string {
    switch(aiLevel) {
        case AILevel.Easy:
            return "Easy";
        case AILevel.Normal:
            return "Normal";
        case AILevel.Hard:
            return "Hard";
    }
}

export function contestName(contest: Contest): string {
    return contest.displayName ?? contest.name ?? `#${contest._id}`;
}