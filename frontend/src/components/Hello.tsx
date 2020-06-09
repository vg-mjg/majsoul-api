import * as React from "react";
import { connect } from "react-redux";
import { IState } from "../IState";
import { ActionType } from "../ActionType";
import { IAction } from "../IAction";
import { ReactNode } from "react";

function fetchPlayers() {
	return function (dispatch: React.Dispatch<IAction>) {
		return fetch("http://localhost:3000/players/")
			.then(response => response.json())
			.then(players => dispatch({
				type: ActionType.PlayersUpdated,
				players
			}));
	}
}

export interface PlayersProps {
	players: [],
	fetchPlayers?: () => Promise<[]>;
}

export interface PlayerProps {
	player: {
		displayName: string
	}
}

export class Player extends React.Component<PlayerProps> {
	render(): ReactNode {
		return <div>{this.props.player.displayName}</div>
	}
}

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class Players extends React.Component<PlayersProps> {
	componentDidMount(): void {
		this.props.fetchPlayers().then(console.log).catch(console.log);
	}

	render(): ReactNode {
		return <h1>{this.props.players.map(player => <Player player={player} />)}</h1>;

	}
}

function mapStateToProps(state: IState): PlayersProps {
	return {
		players: state.players ?? []
	}
}

export const ConnectedComponent = connect(
	mapStateToProps,
	{
		fetchPlayers
	}
)(Players);
