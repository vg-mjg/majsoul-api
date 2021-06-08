import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as en from 'assets/i18n/en.json';
import * as ja from 'assets/i18n/ja.json';

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: en },
			ja: { translation: ja },
		},
		fallbackLng: "ja",
		supportedLngs: ["en", "ja"],
		debug: process.env.NODE_ENV !== "production",
		interpolation: {
			escapeValue: false,
		}
	});

export default i18n;
