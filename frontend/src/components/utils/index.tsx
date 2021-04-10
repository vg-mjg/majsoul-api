import { Contest } from "src/State";

export function contestName(contest: Contest): string {
    return contest.displayName ?? contest.name ?? `#${contest._id}`;
}