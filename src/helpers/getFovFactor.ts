import Angle from "../Angle/Angle";

/**
 * Calculates the factor used for field-of-view projection.
 *
 * @param fov - Field of view in degrees.
 * @returns The calculated FOV factor.
 */
export default function getFovFactor(fov: number): number {
	return Math.tan(Angle.fromDegrees(fov / 4).radians);
}
