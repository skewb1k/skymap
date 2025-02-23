export default class AstronomicalTime {
	private readonly date: Date;

	private gstCache: number | undefined;
	private julianDateCache: number | undefined;

	private constructor(date: Date) {
		this.date = date;
	}

	static fromUTCDate(date: Date): AstronomicalTime {
		return new AstronomicalTime(date);
	}

	/**
	 * Returns the UTC date stored in the object.
	 * @returns The UTC date as a Date object.
	 */
	get UTCDate(): Date {
		return this.date;
	}

	/**
	 * Converts the current date to Julian Date (JD).
	 * @returns The Julian Date (JD).
	 */
	get julianDate(): number {
		if (this.julianDateCache === undefined) {
			const year = this.date.getUTCFullYear();
			const month = this.date.getUTCMonth() + 1; // JavaScript months are 0-based
			const day = this.date.getUTCDate();
			const hour = this.date.getUTCHours();
			const minute = this.date.getUTCMinutes();
			const second = this.date.getUTCSeconds();

			// Adjust year and month for January and February
			const adjustedYear = month <= 2 ? year - 1 : year;
			const adjustedMonth = month <= 2 ? month + 12 : month;

			// Calculate the Julian Day Number (JDN)
			const A = Math.floor(adjustedYear / 100);
			const B = 2 - A + Math.floor(A / 4);
			const JD0 =
				Math.floor(365.25 * (adjustedYear + 4716)) + Math.floor(30.6001 * (adjustedMonth + 1)) + day + B - 1524.5;

			// Calculate the fractional day from the time
			const fractionalDay = (hour + minute / 60 + second / 3600) / 24;

			this.julianDateCache = JD0 + fractionalDay;
		}
		return this.julianDateCache;
	}

	/**
	 * Calculates the Greenwich Sidereal Time (GST) in hours.
	 * @returns The GST in hours (range: 0–24).
	 */
	get GST(): number {
		if (this.gstCache === undefined) {
			const d = this.julianDate - 2451545.0; // Days since J2000.0
			const gmstInDegrees = 280.46061837 + 360.98564736629 * d;
			this.gstCache = gmstInDegrees;
		}
		return this.gstCache;
	}

	/**
	 * Converts GST to Local Sidereal Time (LST) for a given longitude.
	 * @param longitude - The longitude in degrees.
	 * @returns The Local Sidereal Time (LST) in degrees.
	 */
	public LST(longitude: number): number {
		return this.GST + longitude;
	}
}
