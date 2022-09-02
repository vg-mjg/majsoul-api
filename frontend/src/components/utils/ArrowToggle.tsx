import { stylesheet } from "astroturf";
import * as React from "react";
import Container from "react-bootstrap/Container";
import { BsChevronCompactUp, BsChevronCompactDown } from "react-icons/bs";

const styles = stylesheet`
	@import '../../bootstrap-vars.sass';

	.arrow {
		cursor: pointer;
		&:hover {
			svg {
				fill: $gray-500;
			}
		}
	}
`;

export const ArrowToggle: React.FC<{
	pointUp?: boolean
}> = ({pointUp}) => {
	return <Container className={styles.arrow}>
		{pointUp
			? <BsChevronCompactUp color="white" size="30px" />
			: <BsChevronCompactDown color="white" size="30px" />
		}
	</Container>;
};
