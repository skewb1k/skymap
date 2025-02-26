/**
 * Linear interpolation between two angles.
 *
 * @param start - The starting value.
 * @param end - The target value.
 * @param t - A value between 0 and 1 representing the interpolation factor.
 * @returns The interpolated value.
 */
export default function lerpAngle(start: number, end: number, t: number): number {
	let difference = end - start;
	const fullRotation = 360;

	// Normalize the difference to be within the range of -180 to 180
	difference = ((difference % fullRotation) + fullRotation) % fullRotation;
	if (difference > 180) {
		difference -= fullRotation;
	}

	return start + difference * t;
}
