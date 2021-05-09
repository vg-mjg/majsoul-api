import * as React from "react";
import * as dayjs from "dayjs";
import { withLocale } from "src/api/utils";

const calendarSetting = {
	sameDay: function (this: dayjs.Dayjs, now: dayjs.Dayjs) {
		if (this.isAfter(now)) {
			return dayjs.duration(this.diff(now)).locale("en").format('[Starts] [in] H:mm:ss');
		}
		return dayjs.duration(now.diff(this)).locale("en").format('[Started] H:mm:ss [ago]');
	},
	nextDay: function (this: dayjs.Dayjs, now: dayjs.Dayjs) {
		const diff = dayjs.duration(this.diff(now)).locale("en");
		return diff.format(`[Starts] [in] ${diff.days() >= 1 ? "D [day] [and] " : ""}H:mm:ss`);
	},
	nextWeek: withLocale("en", '[Starts] [on] dddd [at] LT'),
	lastDay: function (this: dayjs.Dayjs, now: dayjs.Dayjs) {
		const diff = dayjs.duration(now.diff(this)).locale("en");
		return diff.format(`[Started] ${diff.days() >= 1 ? "D [day] [and] " : ""}H:mm:ss [ago]`);
	},
	lastWeek: withLocale("en", '[Started] [Last] dddd'),
	sameElse: function (this: dayjs.Dayjs, now: dayjs.Dayjs) {
		return `${now.isAfter(this) ? "Started" : "Starts"} ${this.format('[on] l')}`;
	},
};

export function CountdownTimer(props: {
	targetTime: number,
	prefix?: string,
}): JSX.Element {
	const [timeNow, setTimeNow] = React.useState(Date.now());
	const targetTime = React.useMemo(() => dayjs(props.targetTime), [props.targetTime]);

	React.useEffect(() => {
		const interval = setInterval(() => {
			setTimeNow(Date.now());
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	}, [setTimeNow]);

	return <h3 className="mb-0">
		{props.prefix == null ? "" : `${props.prefix} `}{targetTime.calendar(null, calendarSetting)}
	</h3>;
}
