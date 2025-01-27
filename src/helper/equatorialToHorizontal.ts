import { Angle } from "../Angle";
import type AstronomicalTime from "../AstronomicalTime/AstronomicalTime";

export default function equatorialToHorizontal(
	ra: Angle,
	dec: Angle,
	lat: Angle,
	lon: Angle,
	date: AstronomicalTime,
): {
	alt: Angle;
	az: Angle;
} {
	const lst = date.LST(lon);
	const ha = lst.subtract(ra);

	const sinAlt = dec.sin * lat.sin + dec.cos * lat.cos * ha.cos;
	const alt = Angle.fromRadians(Math.asin(sinAlt));

	// Handle poles (latitude = ±90)
	if (lat.degrees === 90) {
		return {
			alt,
			az: lst.subtract(ra),
		};
	}

	if (lat.degrees === -90) {
		return {
			alt,
			az: lst.add(ra),
		};
	}

	const cosAz = (dec.sin - lat.sin * sinAlt) / (lat.cos * alt.cos);
	const sinAz = (-ha.sin * dec.cos) / alt.cos;
	const az = Angle.fromRadians(Math.atan2(sinAz, cosAz));

	return { alt, az };
}
