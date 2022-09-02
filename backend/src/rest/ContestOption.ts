import { ObjectId } from "mongodb";

import { Contest } from "../store/types/contest/Contest.js";

export interface ContestOption {
	contestId?: ObjectId;
	contest?: Contest<ObjectId>;
}
