/**
 * Calculates the Julian Date (JD) for a given date and time.
 * @param date - The JavaScript Date object representing the desired time.
 * @returns The Julian Date (JD) as a number.
 */
export default function julianDate(date: Date): number {
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth() + 1; // JavaScript months are 0-based
	const day = date.getUTCDate();
	const hour = date.getUTCHours();
	const minute = date.getUTCMinutes();
	const second = date.getUTCSeconds();

	// Adjust year and month for January and February
	const adjustedYear = month <= 2 ? year - 1 : year;
	const adjustedMonth = month <= 2 ? month + 12 : month;

	// Calculate the Julian Day Number (JDN)
	const A = Math.floor(adjustedYear / 100);
	const B = 2 - A + Math.floor(A / 4);
	const JD0 =
		Math.floor(365.25 * (adjustedYear + 4716)) +
		Math.floor(30.6001 * (adjustedMonth + 1)) +
		day +
		B -
		1524.5;

	// Calculate the fractional day from the time
	const fractionalDay = (hour + minute / 60 + second / 3600) / 24;

	// Round to 6 decimal places
	return Number((JD0 + fractionalDay).toFixed(6));
}
