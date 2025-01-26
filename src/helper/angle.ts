import { Angle } from "../Angle";

export function equatorialToHorizontal(
	hourAngle: Angle,
	declination: Angle,
	latitude: Angle,
): {
	altitude: Angle;
	azimuth: Angle;
} {
	// if (Math.abs(latitude.degrees) >= 89.99) {
	// 	const altitude = Angle.fromDegrees(
	// 		90 -
	// 			(latitude.degrees > 0
	// 				? 90 - declination.degrees
	// 				: 90 + declination.degrees),
	// 	);

	// 	// At poles, azimuth is essentially the hour angle
	// 	// Adding/subtracting 180° depending on which pole
	// 	const azimuth = Angle.fromDegrees(
	// 		latitude.degrees > 0 ? hourAngle.degrees : hourAngle.degrees + 180,
	// 	);

	// 	return { altitude, azimuth };
	// }

	// Calculate altitude

	const altitude = Angle.fromRadians(
		Math.asin(
			latitude.sin * declination.sin +
				latitude.cos * declination.cos * hourAngle.cos,
		),
	);

	// Calculate azimuth
	const azimuth = Angle.fromRadians(
		Math.atan2(
			-hourAngle.sin,
			hourAngle.cos * latitude.sin - declination.tan * latitude.cos,
		),
	);

	return {
		altitude: altitude,
		azimuth: azimuth,
	};
}
