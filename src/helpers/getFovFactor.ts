import { degToRad } from "../Angle/angleconv";

/**
 * Calculates the factor used for field-of-view projection.
 *
 * @param fov - Field of view in degrees.
 * @returns The calculated FOV factor.
 */
export default function getFovFactor(fov: number): number {
	return Math.tan(degToRad(fov / 4));
}
