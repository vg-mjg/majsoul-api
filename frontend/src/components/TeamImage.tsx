import { stylesheet } from "astroturf";
import { Store } from "backend";
import clsx from "clsx";
import * as React from "react";

import defaultImage from "../../assets/shamiko.jpg";
import { LoadingSpinner } from "./utils/LoadingSpinner";

const styles = stylesheet`
	.container {
		display: flex;
		position: relative;
		justify-content: center;
		align-items: center;

		height: 40px;
		width: 40px;
	}

	.image {
		max-width: 100%;
		max-height: 100%;
	}
`;

export function TeamImage(props: {
	teamImage: string;
	className?: string;
	imageClassName?: string;
}) {
	return <div
		className={clsx(styles.container, props.className)}
	>
		{props.teamImage === undefined
			? <LoadingSpinner />
			: <img src={props.teamImage ?? defaultImage} className={clsx(props.imageClassName, styles.image)} />
		}
	</div>;
}
