import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as en from 'assets/i18n/en.json';
import * as jp from 'assets/i18n/jp.json';

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: en },
			jp: { translation: jp },
		},
		fallbackLng: "jp",
		supportedLngs: ["en", "jp"],
		debug: process.env.NODE_ENV !== "production",
		interpolation: {
			escapeValue: false,
		}
	});

export default i18n;
