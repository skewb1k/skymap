import { radToDeg } from "../Angle/angleconv";

export function equatorialToHorizontal(
	ra: number,
	dec: number,
	lat: number,
	lst: number,
): {
	alt: number;
	az: number;
} {
	const ha = ra - lst;

	const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
	const alt = Math.asin(sinAlt);
	const altDeg = radToDeg(alt);

	// Handle poles (latitude = ±90)
	if (lat === Math.PI / 2) {
		return {
			alt: altDeg,
			az: ha + Math.PI,
		};
	}

	if (lat === -Math.PI / 2) {
		return {
			alt: altDeg,
			az: -ha,
		};
	}

	const cosAz = (Math.sin(dec) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(alt));
	const sinAz = (-Math.sin(ha) * Math.cos(dec)) / Math.cos(alt);
	const az = Math.atan2(sinAz, cosAz);
	return { alt: altDeg, az };
}
