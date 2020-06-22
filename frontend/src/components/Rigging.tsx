import * as React from "react";
import { getRiggingToken } from "../Actions";
import { IState } from "../State";
import { connect } from "react-redux";
import Container from "react-bootstrap/Container";
import { RiggingLogin } from "./RiggingLogin";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

interface RiggingComponentDispatchProps {
}

interface RiggingComponentStateProps extends RiggingProps {
	token: string;
}

interface RiggingComponentState {
}

class RiggingComponent extends React.Component<RiggingComponentStateProps & RiggingComponentDispatchProps, RiggingComponentState> {
	constructor(props: Readonly<RiggingComponentStateProps & RiggingComponentDispatchProps>) {
		super(props);
	}

	render() {
		if (this.props.token == null) {
			return <Container className="pt-5">
				<Row className="justify-content-center">
					<Col md="auto">
						<RiggingLogin />
					</Col>
				</Row>
			</Container>
		}

		return null;
	}
}

interface RiggingProps {

}

function mapStateToProps(state: IState, props: RiggingProps): RiggingComponentStateProps {
	return {
		token: state.user?.token
	}
}

export const Rigging = connect(
	mapStateToProps,
	{

	}
)(RiggingComponent);
