import * as React from "react";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from "react-bootstrap/Form";
import { useState } from "react";

export function TextField(props: {
	id: string;
	label: string;
	fallbackValue: string;
	placeholder?: string;
	inline?: boolean;
	type?: string;
	onChange?: (oldValue: string, newValue: string) => { value: string; isValid: boolean; };
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

	return <Form.Group as={Row} className="no-gutters">
		<Form.Label
			column
			className="mr-2 font-weight-bold"
			htmlFor={props.id}
			sm={inline ? "auto" : "3"}
		>
			{props.label}
		</Form.Label>
		<Col>
			<Form.Control
				id={props.id}
				plaintext={!isEditing}
				readOnly={!isEditing}
				isInvalid={!isValid}
				type={props.type}
				className={`${inline ? "" : "text-right"} ${isEditing ? "" : " text-light"}`}
				value={value === undefined ? props.fallbackValue ?? "" : value === null ? "" : value}
				placeholder={placeholder}
				onChange={event => {
					const changeResult = onChange(value, event.target.value);
					setValue(changeResult.value);
					setIsValid(changeResult.isValid);
				}}
				onFocus={(event: any) => setIsEditing(true)}
				onBlur={(event: any) => {
					setIsEditing(false);
					const commitValue = onCommit(value === "" ? null : value, isValid);
					if (commitValue !== value) {
						setValue(commitValue);
					}
				}} />
		</Col>
	</Form.Group>;
}
