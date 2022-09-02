import * as React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import { useState } from "react";
import clsx from "clsx";
import Container from "react-bootstrap/Container";

export function TextField(props: {
	id: string;
	isLocked?: boolean;
	label?: string;
	fallbackValue?: string;
	placeholder?: string;
	inline?: boolean;
	type?: string;
	className?: string;
	onChange?: (oldValue: string, newValue: string) => { value: string; isValid: boolean; } | void;
	onCommit?: (value: string, isValid: boolean) => string;
}): JSX.Element {
	const {
		placeholder = "Not Specified",
		inline = false,
		onChange = (_, newValue) => ({ value: newValue, isValid: true }),
		onCommit = (value) => value
	} = props;
	const [value, setValue] = useState<string>();
	const [isEditing, setIsEditing] = useState(false);
	const [isValid, setIsValid] = useState(true);

	return <Container>
		<Form.Group as={Row} className="no-gutters">
			{ props.label &&
			<Form.Label
				column
				className="mr-2 font-weight-bold"
				htmlFor={props.id}
				sm={inline ? "auto" : "3"}
			>
				{props.label}
			</Form.Label>
			}
			<Col>
				<Form.Control
					id={props.id}
					plaintext={!props.isLocked && !isEditing}
					readOnly={!props.isLocked && !isEditing}
					isInvalid={!isValid}
					type={props.type}
					className={clsx((props.label && !inline) && "text-right", !isEditing && " text-light", props.className)}
					value={value === undefined ? props.fallbackValue ?? "" : value === null ? "" : value}
					placeholder={placeholder}
					onChange={(event: any) => {
						const changeResult = onChange(value, event.target.value);
						if (changeResult == null){
							setValue(event.target.value);
							setIsValid(true);
							return;
						}

						setValue((changeResult as any).value);
						setIsValid((changeResult as any).isValid);
					}}
					onFocus={() => setIsEditing(true)}
					onBlur={() => {
						setIsEditing(false);
						const commitValue = onCommit(value === "" ? null : value, isValid);
						if (commitValue !== value) {
							setValue(commitValue);
						}
					}} />
			</Col>
		</Form.Group>
	</Container>;
}
