import { Angle } from "../Angle";

export default function equatorialToHorizontal(
	ra: Angle,
	dec: Angle,
	lat: Angle,
	lst: Angle,
): {
	alt: Angle;
	az: Angle;
} {
	const ha = ra.subtract(lst);

	const sinAlt = dec.sin * lat.sin + dec.cos * lat.cos * ha.cos;
	const alt = Angle.fromRadians(Math.asin(sinAlt));

	// Handle poles (latitude = ±90)
	if (lat.degrees === 90) {
		return {
			alt,
			az: ha.addDegrees(180),
		};
	}

	if (lat.degrees === -90) {
		return {
			alt,
			az: ha.multiply(-1),
		};
	}

	const cosAz = (dec.sin - lat.sin * sinAlt) / (lat.cos * alt.cos);
	const sinAz = (-ha.sin * dec.cos) / alt.cos;
	const az = Angle.fromRadians(Math.atan2(sinAz, cosAz));
	return { alt, az };
}
