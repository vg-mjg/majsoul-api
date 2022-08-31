import { ObjectId } from 'mongodb';
import { Store } from '..';


export interface ContestOption {
	contestId?: ObjectId;
	contest?: Store.Contest<ObjectId>;
}
