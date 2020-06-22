import * as React from "react";
import { getRiggingToken, GetRiggingTokenOptions } from "../Actions";
import { IState } from "../State";
import { connect } from "react-redux";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

type FormControlElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

interface RiggingComponentDispatchProps {
	getRiggingToken(params: GetRiggingTokenOptions): Promise<boolean>;
}

interface RiggingComponentStateProps extends RiggingProps {
}

interface RiggingComponentState {
	username: string;
	password: string;
	failed: boolean;
}

class RiggingComponent extends React.Component<RiggingComponentStateProps & RiggingComponentDispatchProps, RiggingComponentState> {
	constructor(props: Readonly<RiggingComponentStateProps & RiggingComponentDispatchProps>) {
		super(props);
		this.state = {
			username: "",
			password: "",
			failed: false
		};
	}

	render() {
		return <Form
			className="bg-dark rounded p-4"
			style={{maxWidth: "400px"}}
			onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.onFormSubmit(event)}
		>
			<Form.Group as={Form.Row}>
				<Form.Control
					placeholder="Username"
					value={this.state.username}
					onChange={(event) => this.onUserNameChanged(event)}
				/>
			</Form.Group>
			<Form.Group as={Form.Row}>
				<Form.Control
					type="password"
					placeholder="Password"
					value={this.state.password}
					onChange={(event) => this.onPasswordChanged(event)}
				/>
			</Form.Group>
			<Form.Row className="align-items-center">
				<Col>
					{this.state.failed && <u className="text-danger" >Invalid username or password.</u>}
				</Col>
				<Col md="auto">
					<Button variant="secondary" type="submit">
						Jack In
					</Button>
				</Col>
			</Form.Row>
		</Form>
	}

	onPasswordChanged(event: React.FormEvent<FormControlElement>): void {
		this.setState({
			...this.state,
			password: (event.target as HTMLInputElement).value,
		});
	}

	private onUserNameChanged(event: React.FormEvent<FormControlElement>): void {
		this.setState({
			...this.state,
			username: (event.target as HTMLInputElement).value
		});
	}

	private onFormSubmit(event: React.FormEvent<HTMLFormElement>): void {
		this.props.getRiggingToken({
			username: this.state.username,
			password: this.state.password,
		}).then(tokenAquired => this.setState({ ...this.state, failed: !tokenAquired }));
		event.preventDefault();
	}
}

interface RiggingProps {

}

function mapStateToProps(state: IState, props: RiggingProps): RiggingComponentStateProps {
	return {
	}
}

export const Rigging = connect(
	mapStateToProps,
	{
		getRiggingToken
	}
)(RiggingComponent);
