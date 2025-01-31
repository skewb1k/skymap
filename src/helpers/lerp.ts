/**
 * Linear interpolation between two numbers.
 *
 * @param start - The starting value.
 * @param end - The target value.
 * @param t - A value between 0 and 1 representing the interpolation factor.
 * @returns The interpolated value.
 */
export default function lerp(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}
