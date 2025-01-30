import type Angle from "../Angle/Angle";
import type Coo from "../types/Coo.type";

export default function projectSphericalTo2D(center: Coo, alt: Angle, az: Angle, radius: number): Coo {
	const r = (radius * (90 - alt.degrees)) / 90; // Adjust for altitude
	return {
		x: center.x + r * az.sin,
		y: center.y - r * az.cos,
	};
}
