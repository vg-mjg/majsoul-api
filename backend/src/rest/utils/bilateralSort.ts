export function bilateralSort<T>(array: T[], sortFunction: (item: T) => number, options?: { ascending: boolean; }): T[] {
	if (options?.ascending) {
		return array.sort((a, b) => sortFunction(a) - sortFunction(b));
	}

	return array.sort((a, b) => sortFunction(b) - sortFunction(a));
}
