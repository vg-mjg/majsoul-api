import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as en from 'assets/i18n/en.json';
import * as ja from 'assets/i18n/ja.json';

const localeKey = "__riichi_locale";

const savedLocale = localStorage.getItem(localeKey);
const urlLocale = window.location.host.startsWith("jp.") ? "ja" : "en";

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: en },
			ja: { translation: ja },
		},
		fallbackLng: savedLocale ?? urlLocale,
		supportedLngs: ["en", "ja"],
		debug: process.env.NODE_ENV !== "production",
		interpolation: {
			escapeValue: false,
		}
	});


export function saveLocale(locale: string) {
	localStorage.setItem(localeKey, locale);
}

export { i18n };
