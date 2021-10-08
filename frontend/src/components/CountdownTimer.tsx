import * as React from "react";
import * as dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { i18n } from "src/init/i18n";

const calendarSetting: Record<string, object> = {
	en: createCountdownCalendarSettings("en"),
	ja: createCountdownCalendarSettings("ja"),
}

function createCountdownCalendarSettings(locale: string) {
	return {
		sameDay: function (this: dayjs.Dayjs, now: dayjs.Dayjs) {
			if (this.isAfter(now)) {
				return dayjs.duration(this.diff(now)).locale(locale).format(i18n.t("time.countdown.sameDay.after"));
			}
			return dayjs.duration(now.diff(this)).locale(locale).format(i18n.t("time.countdown.sameDay.before"));
		},
		nextDay: function (this: dayjs.Dayjs, now: dayjs.Dayjs) {
			const diff = dayjs.duration(this.diff(now)).locale(locale);
			if (diff.days() >= 1) {
				return diff.format(i18n.t("time.countdown.nextDay.greaterThanDay"));
			}
			return diff.format(i18n.t("time.countdown.nextDay.withinDay"));
		},
		nextWeek: function (this: dayjs.Dayjs) {
			return this.locale(locale).format(i18n.t("time.countdown.nextWeek"));
		},
		lastDay: function (this: dayjs.Dayjs, now: dayjs.Dayjs) {
			const diff = dayjs.duration(now.diff(this)).locale(locale);

			if (diff.days() >= 1) {
				return diff.format(i18n.t("time.countdown.lastDay.greaterThanDay"));
			}
			return diff.format(i18n.t("time.countdown.lastDay.withinDay"));
		},
		lastWeek: function (this: dayjs.Dayjs) {
			return this.locale(locale).format(i18n.t("time.countdown.lastWeek"));
		},
		sameElse: function (this: dayjs.Dayjs, now: dayjs.Dayjs) {
			if (now.isAfter(this)) {
				return this.format(i18n.t("time.countdown.sameElse.before"));
			}
			return this.format(i18n.t("time.countdown.sameElse.after"));
		},
	}
}

export function CountdownTimer(props: {
	targetTime: number,
	prefix?: string,
}): JSX.Element {
	const [timeNow, setTimeNow] = React.useState(Date.now());
	const targetTime = React.useMemo(() => dayjs(props.targetTime), [props.targetTime]);

	const { i18n } = useTranslation();

	React.useEffect(() => {
		const interval = setInterval(() => {
			setTimeNow(Date.now());
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	}, [setTimeNow]);

	return <h3 className="mb-0">
		{props.prefix == null ? "" : `${props.prefix} `}{targetTime.calendar(null, calendarSetting[i18n.language])}
	</h3>;
}
