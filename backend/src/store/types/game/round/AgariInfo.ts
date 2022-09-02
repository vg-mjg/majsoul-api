import { Han } from "majsoul";

export interface AgariInfo {
	extras: number;
	winner: number;
	value: number;
	riichi?: boolean;
	han: Han[];
}
