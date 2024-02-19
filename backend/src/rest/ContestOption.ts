import { ObjectId } from "mongodb";

import { Contest } from "../store/types/contest/Contest";

export interface ContestOption {
	contestId?: ObjectId;
	contest?: Contest<ObjectId>;
}
