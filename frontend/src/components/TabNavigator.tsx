import * as React from "react";
import Nav from 'react-bootstrap/Nav';

export function TabNavigator(props: {
	tabs: {
		title: string;
		key: string;
	}[];
	onTabChanged?: (selectedKey: string) => void;
	defaultTab?: string;
	activeTab?: string;
}): JSX.Element {
	const [activeTab, setActiveTab] = React.useState<string>();

	return <Nav
		justify
		variant="tabs"
		activeKey={props.activeTab ?? activeTab ?? props.defaultTab ?? props.tabs[0]?.key}
		className="rounded-top text-light "
		style={{
			backgroundColor: "black"
		}}
		onSelect={(key: string) => {
			setActiveTab(key);
			props.onTabChanged?.(key);
		}}
	>
		{props.tabs.map(tab => <Nav.Item key={tab.key} className="rounded-0">
			<Nav.Link eventKey={tab.key} className="h3 m-0 rounded-0 h-100">{tab.title}</Nav.Link>
		</Nav.Item>)
		}
	</Nav >;
}
