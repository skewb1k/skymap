import { Angle } from "../Angle";

export function equatorialToHorizontal(
	hourAngle: Angle,
	declination: Angle,
	latitude: Angle,
): {
	altitude: Angle;
	azimuth: Angle;
} {
	if (Math.abs(latitude.degrees) >= 89.99) {
		const altitude = Angle.fromDegrees(
			90 -
				(latitude.degrees > 0
					? 90 - declination.degrees
					: 90 + declination.degrees),
		);

		// At poles, azimuth is essentially the hour angle
		// Adding/subtracting 180° depending on which pole
		const azimuth = Angle.fromDegrees(
			latitude.degrees > 0 ? hourAngle.degrees : hourAngle.degrees + 180,
		);

		return { altitude, azimuth };
	}
	const sinAltitude =
		latitude.sin * declination.sin +
		latitude.cos * declination.cos * hourAngle.cos;
	const altitude = Angle.fromRadians(Math.asin(sinAltitude));

	const cosAzimuth =
		(declination.sin - latitude.sin * sinAltitude) /
		(latitude.cos * Math.cos(Math.asin(sinAltitude)));

	// Clamp cosAzimuth to [-1,1] and convert to degrees
	const baseAzimuth = Angle.fromRadians(
		Math.acos(Math.max(-1, Math.min(1, cosAzimuth))),
	);

	const finalAzimuth =
		hourAngle.sin > 0
			? Angle.fromDegrees(360).subtract(baseAzimuth)
			: baseAzimuth;

	return {
		altitude,
		azimuth: finalAzimuth,
	};
}
