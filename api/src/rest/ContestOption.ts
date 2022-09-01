import { ObjectId } from 'mongodb';
import { Store } from '../index.js';


export interface ContestOption {
	contestId?: ObjectId;
	contest?: Store.Contest<ObjectId>;
}
