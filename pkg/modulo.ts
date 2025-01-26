export default function modulo(n: number, d: number): number {
	if (d === 0) {
		return n;
	}

	if (d < 0) {
		return Number.NaN;
	}

	return ((n % d) + d) % d;
}
