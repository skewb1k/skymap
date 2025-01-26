import { Angle } from "./Angle";

export function julianDate(date: Date): number {
	return date.getTime() / 86400000.0 + 2440587.5;
}

export function getLocalSiderealTime(datetime: Date, longitude: Angle): Angle {
	const J2000 = 2451545.0; // Julian date for 2000-01-01 12:00:00 TT
	const jd = julianDate(datetime);
	const centuries = (jd - J2000) / 36525.0; // Julian Century
	const theta0 =
		(280.46061837 +
			360.98564736629 * (jd - 2451545) +
			centuries * centuries * 0.000387933 -
			(centuries * centuries * centuries) / 38710000) %
		360;
	return Angle.fromDegrees((theta0 + longitude.degrees) % 360);
}
