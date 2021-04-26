import * as React from "react";
import Spinner from "react-bootstrap/Spinner";

export function LoadingSpinner(): JSX.Element {
	return <Spinner animation="border" role="status">
		<span className="sr-only">Loading...</span>
	</Spinner>;
}
