import * as React from "react";
import Spinner from "react-bootstrap/Spinner";

export function LoadingSpinner(props: {
	color?: string;
}): JSX.Element {
	return <Spinner animation="border" role="status" color={props.color}>
		<span className="sr-only">Loading...</span>
	</Spinner >;
}
