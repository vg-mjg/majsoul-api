import * as React from "react";
import { getRiggingToken, GetRiggingTokenOptions } from "../../Actions";
import { IState } from "../../State";
import { connect } from "react-redux";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

type FormControlElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

interface RiggingLoginComponentDispatchProps {
	getRiggingToken(params: GetRiggingTokenOptions): Promise<boolean>;
}

interface RiggingLoginComponentStateProps extends RiggingLoginProps {
}

interface RiggingLoginComponentState {
	username: string;
	password: string;
	failed: boolean;
}

class RiggingLoginComponent extends React.Component<RiggingLoginComponentStateProps & RiggingLoginComponentDispatchProps, RiggingLoginComponentState> {
	constructor(props: Readonly<RiggingLoginComponentStateProps & RiggingLoginComponentDispatchProps>) {
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
			style={{minWidth: "360px"}}
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

interface RiggingLoginProps {

}

function mapStateToProps(state: IState, props: RiggingLoginProps): RiggingLoginComponentStateProps {
	return {
	}
}

export const RiggingLogin = connect(
	mapStateToProps,
	{
		getRiggingToken
	}
)(RiggingLoginComponent);
