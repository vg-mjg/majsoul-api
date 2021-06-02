import * as React from 'react';
import { Chart, ChartType, ChartData, ChartOptions, Plugin, registerables, InteractionItem } from 'chart.js';
import { cloneDeep, assign, find } from 'lodash';
import { forwardRef } from 'react';

Chart.register(...registerables);

export interface ChartProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
	id?: string;
	className?: string;
	height?: number;
	width?: number;
	redraw?: boolean;
	type: ChartType;
	data: ChartData | ((canvas: HTMLCanvasElement) => ChartData);
	options?: ChartOptions;
	plugins?: Plugin[];
	fallbackContent?: React.ReactNode;
	getDatasetAtEvent?: (
		dataset: Array<InteractionItem>,
		event: React.MouseEvent<HTMLCanvasElement>
	) => void;
	getElementAtEvent?: (
		element: InteractionItem | undefined,
		event: React.MouseEvent<HTMLCanvasElement>
	) => void;
	getElementsAtEvent?: (
		elements: Array<InteractionItem>,
		event: React.MouseEvent<HTMLCanvasElement>
	) => void;
}

export const ChartComponent = React.forwardRef<Chart | undefined, ChartProps>((props, ref) => {
	const {
		id,
		className,
		height = 150,
		width = 300,
		redraw = false,
		type,
		data,
		plugins,
		options = {},
		getDatasetAtEvent,
		getElementAtEvent,
		getElementsAtEvent,
		fallbackContent,
		...rest
	} = props;

	const canvas = React.useRef<HTMLCanvasElement>(null);

	const computedData = React.useMemo<ChartData>(() => {
		if (typeof data === 'function') {
			return canvas.current ? data(canvas.current) : {} as ChartData;
		} else {
			return { ...data };
		}
	}, [data, canvas.current]);

	const [chart, setChart] = React.useState<Chart>();

	React.useImperativeHandle<Chart | undefined, Chart | undefined>(ref, () => chart, [
		chart,
	]);

	const renderChart = () => {
		if (!canvas.current) {
			return;
		}

		setChart(
			new Chart(canvas.current, {
				type,
				data: computedData,
				options,
				plugins,
			})
		);
	};

	const onClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
		if (!chart) {
			return;
		}

		getDatasetAtEvent &&
			getDatasetAtEvent(
				chart.getElementsAtEventForMode(
					event.nativeEvent,
					'dataset',
					{ intersect: true },
					false
				),
				event
			);

		getElementAtEvent &&
			getElementAtEvent(
				chart.getElementsAtEventForMode(
					event.nativeEvent,
					'nearest',
					{ intersect: false },
					false
				)[0],
				event
			);

		getElementsAtEvent &&
			getElementsAtEvent(
				chart.getElementsAtEventForMode(event.nativeEvent, 'index', { intersect: true }, false),
				event
			);
	};

	const updateChart = () => {
		if (!chart) {
			return;
		}

		if (options) {
			chart.options = { ...options };
		}

		if (!chart.config.data) {
			chart.config.data = computedData;
			chart.update();
			return;
		}

		const { datasets: newDataSets = [], ...newChartData } = computedData;
		const { datasets: currentDataSets = [] } = chart.config.data;

		// copy values
		assign(chart.config.data, newChartData);
		chart.config.data.datasets = newDataSets.map((newDataSet: any) => {
			// given the new set, find it's current match
			const currentDataSet = find(
				currentDataSets,
				d => d.label === newDataSet.label && d.type === newDataSet.type
			);

			// There is no original to update, so simply add new one
			if (!currentDataSet || !newDataSet.data) {
				return newDataSet;
			}

			if (!currentDataSet.data) {
				currentDataSet.data = [];
			} else {
				currentDataSet.data.length = newDataSet.data.length;
			}

			// copy in values
			assign(currentDataSet.data, newDataSet.data);

			// apply dataset changes, but keep copied data
			return {
				...currentDataSet,
				...newDataSet,
				data: currentDataSet.data,
			};
		});

		chart.update();
	};

	const destroyChart = () => {
		if (chart) {
			chart.destroy();
		}
	};

	React.useEffect(() => {
		renderChart();
		return () => destroyChart();
	}, []);

	React.useEffect(() => {
		if (redraw) {
			destroyChart();
			setTimeout(() => {
				renderChart();
			}, 0);
		} else {
			updateChart();
		}
	}, [props, computedData]);

	return (
		<canvas
			{...rest}
			height={height}
			width={width}
			ref={canvas}
			id={id}
			className={className}
			onClick={onClick}
			data-testid='canvas'
			role='img'
		>
			{fallbackContent}
		</canvas>
	);
});

export type DefinedChartProps = Omit<ChartProps, "type">;

export const Line = forwardRef<Chart | undefined, DefinedChartProps>((props, ref) => (
	<ChartComponent
		{...props}
		type='line'
		ref={ref}
		options={props.options || {}}
	/>
));

export const Bar = forwardRef<Chart | undefined, DefinedChartProps>((props, ref) => (
	<ChartComponent
		{...props}
		type='bar'
		ref={ref}
		options={props.options || {}}
	/>
));

export const Radar = forwardRef<Chart | undefined, DefinedChartProps>((props, ref) => (
	<ChartComponent
		{...props}
		type='radar'
		ref={ref}
		options={props.options || {}}
	/>
));

export const Doughnut = forwardRef<Chart | undefined, DefinedChartProps>((props, ref) => (
	<ChartComponent
		{...props}
		type='doughnut'
		ref={ref}
		options={props.options || {}}
	/>
));

export const PolarArea = forwardRef<Chart | undefined, DefinedChartProps>((props, ref) => (
	<ChartComponent
		{...props}
		type='polarArea'
		ref={ref}
		options={props.options || {}}
	/>
));

export const Bubble = forwardRef<Chart | undefined, DefinedChartProps>((props, ref) => (
	<ChartComponent
		{...props}
		type='bubble'
		ref={ref}
		options={props.options || {}}
	/>
));

export const Pie = forwardRef<Chart | undefined, DefinedChartProps>((props, ref) => (
	<ChartComponent
		{...props}
		type='pie'
		ref={ref}
		options={props.options || {}}
	/>
));

export const Scatter = forwardRef<Chart | undefined, DefinedChartProps>((props, ref) => (
	<ChartComponent
		{...props}
		type='scatter'
		ref={ref}
		options={props.options || {}}
	/>
));
