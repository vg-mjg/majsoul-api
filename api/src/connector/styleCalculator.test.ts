import { calculateStyle } from "./styleCalculator.js";

test("Dummy unit test", () => {
	const actual = calculateStyle({} as any);
	expect(actual).toBe(3);
});
