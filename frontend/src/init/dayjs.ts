import "dayjs/locale/en";
import "dayjs/locale/en-nz";
import "dayjs/locale/en-ca";
import "dayjs/locale/en-au";
import "dayjs/locale/en-gb";
import "dayjs/locale/ru";
import "dayjs/locale/it";
import "dayjs/locale/fr";
import "dayjs/locale/fr-ca";
import "dayjs/locale/fi";
import "dayjs/locale/sv";
import "dayjs/locale/pt-br";
import "dayjs/locale/pt";
import "dayjs/locale/de";
import "dayjs/locale/tl-ph";
import "dayjs/locale/ja";
import "dayjs/locale/zh";
import "dayjs/locale/es";
import "dayjs/locale/nl";

import * as dayjs from "dayjs";
import * as advancedFormat from "dayjs/plugin/advancedFormat";
import * as calendar from "dayjs/plugin/calendar";
import * as duration from "dayjs/plugin/duration";
import * as localeData from "dayjs/plugin/localeData";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import * as relativeTime from "dayjs/plugin/relativeTime";
import * as timezone from "dayjs/plugin/timezone";
import * as updateLocale from "dayjs/plugin/updateLocale";
import * as utc from "dayjs/plugin/utc";

import { withLocale } from "../api/utils";
import { i18n } from "./i18n";
dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(calendar);
dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(localeData);
dayjs.extend(updateLocale);

function findSupportedLocale(): string {
	let loc;
	for (const locale of navigator.languages) {
		loc = locale.toLowerCase();
		if (loc === dayjs.locale(loc)) {
			break;
		}
	}

	if (loc === "en" && !dayjs.tz.guess().startsWith("America")) {
		loc = dayjs.locale("en-gb");
	}

	return loc;
}

export function setDayjsLocale(locale?: "ja" | "en") {
	const loc = locale == "en" ? findSupportedLocale() : dayjs.locale("ja");
	const calendarLocale = loc === "ja" ? "ja" : "en";

	dayjs.updateLocale(loc, {
		calendar: {
			lastDay: withLocale(calendarLocale, i18n.t("time.general.lastDay")),
			sameDay: withLocale(calendarLocale, i18n.t("time.general.sameDay")),
			nextDay: withLocale(calendarLocale, i18n.t("time.general.nextDay")),
			lastWeek: withLocale(calendarLocale, i18n.t("time.general.lastWeek")),
			nextWeek: withLocale(calendarLocale, i18n.t("time.general.nextWeek")),
			sameElse: "L"
		}
	});
}

setDayjsLocale("ja");
