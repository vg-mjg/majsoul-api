import * as React from "react";
import { useTranslation } from "react-i18next";

export const PaipuLink = ({majsoulId}: {majsoulId: string}) => {
	const {t} = useTranslation();
	if (!majsoulId) {
		return <span>{t("riggedGame")}</span>
	}
	return <a href={`https://mahjongsoul.game.yo-star.com/?paipu=${majsoulId}`} rel="noreferrer" target="_blank">{t("viewOnMajsoul")}</a>
}
