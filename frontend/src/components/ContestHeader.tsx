import * as React from "react";
import { Contest } from "../State";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { SongPlayer } from "./utils/SongPlayer";
import nantoka_nare from "../../assets/nantoka_nare.mp3";
import { contestName } from "./utils";
import clsx from "clsx";
import { css } from "astroturf";

const classes = css`
	.tagline {
		line-height: 18px;
	}
`;

export function ContestHeader(props: {
	contest: Contest;
}): JSX.Element {
	const [secret, setSecret] = React.useState(false);

	React.useEffect(() => {
		if (!secret) {
			return;
		}

		if (props.contest.majsoulFriendlyId === 866709) {
			new Audio(nantoka_nare as any).play();
			return;
		}
	}, [secret]);

	if (props.contest == null) {
		return null;
	}

	return <>
		{props.contest.anthem == null ? null : <SongPlayer videoId={props.contest.anthem} play={secret} />}
		<Row className="px-4 pt-4 pb-3 no-gutters align-items-center">
			<Col>
				<h1 onClick={() => setSecret(true)}><u style={{ cursor: "pointer" }}>{contestName(props.contest)}</u></h1>
			</Col>
			<Col md="auto">
				<i className={clsx("d-flex flex-column")}>
					{!secret
						? (props.contest.tagline ?? "").split(";;").map(text => <span className={classes.tagline}>{text}</span>)
						: (props.contest.taglineAlternate ?? "").split(";;").map(text => <span className={clsx("text-center", classes.tagline)}>{text}</span>)}
				</i>
			</Col>
		</Row>
	</>;
}
