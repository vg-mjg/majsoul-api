import { ObjectID } from 'mongodb';
import { Store } from '..';


export interface ContestOption {
	contestId?: ObjectID;
	contest?: Store.Contest<ObjectID>;
}
