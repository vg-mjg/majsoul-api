import { AILevel } from "majsoul/dist/enums";

import { Contest } from "../../State";

export function levelToString(aiLevel: AILevel): string {
	switch (aiLevel) {
		case AILevel.Easy:
			return "Easy";
		case AILevel.Normal:
			return "Normal";
		case AILevel.Hard:
			return "Hard";
	}
}

export function contestName(contest: Contest): string {
	return contest.displayName ?? contest.name ?? `#${contest._id}`;
}

type RecordableKeys<T> = {
	[K in keyof T]:
	T[K] extends string
	? K
	: never
}[keyof T]

export function toRecord<
	T extends Partial<{ [P in RecordableKeys<T>]: string }>,
	K extends RecordableKeys<T>
>(array: T[], selector: K): Record<string, T> {
	if (array == null) {
		return {};
	}
	return array.reduce((acc, item) => (acc[item[selector]] = item, acc), {} as Record<T[K], T>);
}


interface RGBColor {
	r: number;
	g: number;
	b: number;
}

export function hslStyle(hsl: { h: number, s: number, l: number }) {
	return `hsl(${Math.round(hsl.h * 360)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
}

export function invertHex(hex: string): string {
	return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase();
}

export function hexToRgb(hex: string): RGBColor {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

export function rgbToHsl(color: string) {
	let { r, g, b } = hexToRgb(color);
	r /= 255, g /= 255, b /= 255;

	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h, s;
	const l = (max + min) / 2;

	if (max == min) {
		h = s = 0; // achromatic
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}

		h /= 6;
	}

	return { h, s, l };
}

export function pickColorGradient(color1: string, color2: string, weight: number) {
	const c1 = hexToRgb(color1);
	const c2 = hexToRgb(color2);
	const w = weight * 2 - 1;
	const w1 = (w / 1 + 1) / 2;
	const w2 = 1 - w1;
	return {
		r: Math.round(c1.r * w1 + c2.r * w2),
		g: Math.round(c1.g * w1 + c2.g * w2),
		b: Math.round(c1.b * w1 + c2.b * w2)
	};
}
