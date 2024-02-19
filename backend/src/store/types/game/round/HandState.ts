import { HandStatus } from "../../enums/HandStatus";

export interface OpenHandState {
	status: HandStatus.Open;
}

export interface RiichiHandState {
	status: HandStatus.Riichi;
	furiten?: boolean;
	index: number;
}

export interface ClosedHandState {
	status: HandStatus.Closed;
}

export type HandState = OpenHandState | RiichiHandState | ClosedHandState;
