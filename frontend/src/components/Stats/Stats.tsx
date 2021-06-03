import * as React from "react";
import { Rest } from "majsoul-api";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import clsx from "clsx";
import * as globalStyles from "../styles.sass";
import { VersionedStatsDisplay } from "./VersionedStatsDisplay";

export interface StatsPlayerProps {
	teamName?: string;
	playerName?: string;
}

export function Stats(props: { stats: Rest.Stats; onSelectTeam?: () => void; } & StatsPlayerProps): JSX.Element {
	return <Container className={clsx("p-0")}>
		<Row>
			<Col className="text-center">
				<span
					className={clsx("h5 font-weight-bold", globalStyles.linkDark)}
					onClick={() => props.onSelectTeam()}
				>{props.teamName}</span>&nbsp;
				<span className="h5">{props.playerName}</span>
			</Col>
		</Row>
		<Row>
			<VersionedStatsDisplay stats={props.stats} />
		</Row>
	</Container>;
}
