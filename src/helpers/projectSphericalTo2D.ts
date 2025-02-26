import type Coo from "../types/Coo.type";

export default function projectSphericalTo2D(center: Coo, alt: number, az: number, radius: number): Coo {
	const r = (radius * (90 - alt)) / 90;
	return {
		x: center.x + r * Math.sin(az),
		y: center.y - r * Math.cos(az),
	};
}
