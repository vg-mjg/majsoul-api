import * as React from "react";
import * as moment from "moment-timezone";

interface TimerProps {
	targetTime: number;
}

interface TimerState {
	time: number;
}

export class CountdownTimer extends React.Component<TimerProps, TimerState> {
	private interval: any;
	public componentDidMount(): void {
		this.interval = setInterval(() => {
			this.setState(
				{
					...this.state,
					...{
						time: Date.now()
					}
				}
			);
		}, 1000);
	}

	public componentWillUnmount(): void {
		clearInterval(this.interval);
	}

	public render(): JSX.Element {
		if (this.state?.time == null) {
			return null;
		}

		const difference = moment.duration(moment(this.props.targetTime).diff(moment(this.state.time)));
		return <h3 className="mb-0">Next Session in {difference.days() > 0 && `${difference.days()}d`} {difference.hours()}:{difference.minutes()}:{difference.seconds()}</h3>;
	}
}
