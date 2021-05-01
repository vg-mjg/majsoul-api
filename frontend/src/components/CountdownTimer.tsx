import * as React from "react";
import * as moment from "moment-timezone";

interface TimerProps {
	targetTime: number;
	prefix?: string;
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

		const targetMoment = moment(this.props.targetTime);
		const nowMoment = moment(this.state.time);
		let difference: moment.Duration;
		const future = nowMoment.isBefore(targetMoment);
		if (future){
			difference = moment.duration(targetMoment.diff(nowMoment));
		} else {
			difference = moment.duration(nowMoment.diff(targetMoment));
		}

		return <h3 className="mb-0">
			{this.props.prefix && `${this.props.prefix} `}
			{future ? "Starts in " : "Started "}
			{
				difference.asMonths() >= 1
					? difference.humanize(false)
					: `${difference.days() != 0 ? `${difference.days()}d` : ""} ${difference.hours()}:${difference.minutes()}:${difference.seconds()}`
			}
			{!future && " ago"}
		</h3>;
	}
}
