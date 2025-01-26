import { Angle } from "./Angle";

export function getLocalSiderealTime(datetime: Date, longitude: Angle): Angle {
	// console.log(datetime);
	const jd = julianDate(datetime);
	const JD0 = Math.floor(jd - 0.5) + 0.5;
	const S = JD0 - 2451545.0;
	const T = S / 36525.0;
	let T0 = (6.697374558 + 2400.051336 * T + 0.000025862 * T * T) % 24;
	if (T0 < 0) T0 += 24;
	const UT =
		((datetime.getUTCMilliseconds() / 1000 + datetime.getUTCSeconds()) / 60 +
			datetime.getUTCMinutes()) /
			60 +
		datetime.getUTCHours();
	const A = UT * 1.002737909;
	T0 += A;
	let GST = T0 % 24;
	if (GST < 0) GST += 24;
	let d = (GST + longitude.degrees / 15.0) / 24.0;
	d = d - Math.floor(d);
	if (d < 0) d += 1;
	const LST = 24.0 * d;
	return Angle.fromDegrees(LST * 15); // Convert hours to degrees
}

// Helper function to calculate Julian Date (JD)
export function julianDate(date: Date): number {
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth() + 1; // Months are 0-based in JS
	const day =
		date.getUTCDate() +
		date.getUTCHours() / 24 +
		date.getUTCMinutes() / 1440 +
		date.getUTCSeconds() / 86400;

	// If the month is January or February, treat it as part of the previous year
	let Y = year;
	let M = month;
	if (month <= 2) {
		Y -= 1;
		M += 12;
	}

	// Calculate Julian Day Number (JDN)
	const A = Math.floor(Y / 100);
	const B = 2 - A + Math.floor(A / 4);
	const JDN =
		Math.floor(365.25 * (Y + 4716)) +
		Math.floor(30.6001 * (M + 1)) +
		day +
		B -
		1524.5;

	return JDN;
}
