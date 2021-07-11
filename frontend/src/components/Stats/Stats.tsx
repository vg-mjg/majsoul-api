import * as React from 'react'
import { Rest } from "majsoul-api";
import { fetchStats, StatsRequest } from '../../api/Contests';
import { ContestContext } from '../Contest/ContestProvider';
import { LoadingSpinner } from '../utils/LoadingSpinner';
import { VersionedStatsDisplay } from './VersionedStatsDisplay';
import Container from 'react-bootstrap/Container';

export const Stats: React.FC<{
	request: StatsRequest;
	hideResults?: boolean;
	loadingSpinnerClassName?: string;
}> = ({request, hideResults, loadingSpinnerClassName}) => {
	const { contestId } = React.useContext(ContestContext);
	const [stats, setStats] = React.useState<Rest.Stats>(null);

	const targetId = request == null ? null : "team" in request ? request.team : "player" in request ? request.player : null;

	React.useEffect(() => {
		if (!contestId || !request || !targetId) {
			return;
		}

		setStats(null);

		fetchStats(
			contestId,
			request
		).then(stats => {
			setStats(stats[targetId]);
		})
	}, [contestId, targetId]);

	if (hideResults) {
		return null;
	}

	if (!stats) {
		return <Container className={loadingSpinnerClassName}><LoadingSpinner/></Container>
	}

	return <VersionedStatsDisplay stats={stats} />
}
