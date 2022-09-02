import * as React from "react";
import { useDispatch } from "react-redux";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { useHistory } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { dispatchRiggingTokenAcquired } from "../../actions/rigging/RiggingTokenAcquired";
import { getRiggingToken } from "../../api/Rigging";
import * as backend from "backend";

export function RiggingLogin() {
	const [username, setUsername] = React.useState<string>("");
	const [password, setPassword] = React.useState<string>("");
	const [failed, setFailed] = React.useState(false);

	const dispatch = useDispatch();
	const history = useHistory();

	const onFormSubmit = React.useCallback((event: any) => {
		getRiggingToken({
			username,
			password,
		}).then(token => {
			if (!token) {
				setFailed(true);
				return;
			}

			dispatchRiggingTokenAcquired(dispatch, token);
			history.push("/");
		});
		event.preventDefault();
	}, [username, password, setPassword]);

	const onUserNameChanged = React.useCallback((event: any) => {
		setUsername(event.target.value as string);
	}, [setPassword]);

	const onPasswordChanged = React.useCallback((event: any) => {
		setPassword(event.target.value as string);
	}, [setPassword]);

	return <Container className="pt-5">
		<Row className="justify-content-center">
			<Col md="auto">
				<Form
					className="bg-dark rounded p-4"
					style={{minWidth: "360px"}}
					onSubmit={onFormSubmit}
				>
					<Form.Group as={Form.Row}>
						<Form.Control
							placeholder="Username"
							value={username}
							onChange={onUserNameChanged}
						/>
					</Form.Group>
					<Form.Group as={Form.Row}>
						<Form.Control
							type="password"
							placeholder="Password"
							value={password}
							onChange={onPasswordChanged}
						/>
					</Form.Group>
					<Form.Row className="align-items-center">
						<Col>
							{failed && <u className="text-danger" >Invalid username or password.</u>}
						</Col>
						<Col md="auto">
							<Button variant="secondary" type="submit">
								Jack In
							</Button>
						</Col>
					</Form.Row>
				</Form>
			</Col>
		</Row>
	</Container>;
}
