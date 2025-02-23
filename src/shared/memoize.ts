export default function memoize(fn: (arg: number) => number): (arg: number) => number {
	const cache = new Map<number, number>();

	return (arg: number) => {
		const c = cache.get(arg);
		if (c !== undefined) {
			return c;
		}

		const result = fn(arg);
		cache.set(arg, result);
		return result;
	};
}
