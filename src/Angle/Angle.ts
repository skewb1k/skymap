enum AngleUnit {
	Degrees = 0,
	Radians = 1,
	Hours = 2,
}

export default class Angle {
	private readonly _radians: number;

	private degreesCache: number | undefined;
	private hoursCache: number | undefined;
	private sinCache: number | undefined;
	private cosCache: number | undefined;
	private tanCache: number | undefined;

	private constructor(value: number, unit = AngleUnit.Radians) {
		this._radians =
			unit === AngleUnit.Degrees ? this.degToRad(value) : unit === AngleUnit.Hours ? this.hoursToRad(value) : value;
	}

	private degToRad(deg: number): number {
		return (deg * Math.PI) / 180;
	}

	private radToDeg(rad: number): number {
		return (rad * 180) / Math.PI;
	}

	private radToHours(rad: number): number {
		return (rad * 12) / Math.PI;
	}

	private hoursToRad(hours: number): number {
		return (hours * Math.PI) / 12;
	}

	get degrees(): number {
		if (this.degreesCache) return this.degreesCache;

		const degrees = this.radToDeg(this._radians);
		this.degreesCache = degrees;
		return degrees;
	}

	get radians(): number {
		return this._radians;
	}

	get hours(): number {
		if (this.hoursCache) return this.hoursCache;

		const hours = this.radToHours(this._radians);
		this.hoursCache = hours;
		return hours;
	}

	static fromDegrees(degrees: number): Angle {
		return new Angle(degrees, AngleUnit.Degrees);
	}

	static fromRadians(radians: number): Angle {
		return new Angle(radians, AngleUnit.Radians);
	}

	static fromHours(hours: number): Angle {
		return new Angle(hours, AngleUnit.Hours);
	}

	/**
	 * Normalizes an angle to the range [0, 2π).
	 * @returns A new Angle.
	 */
	public normalize(): Angle {
		const twoPi = 2 * Math.PI;
		let normalizedRadians = this._radians % twoPi;
		if (normalizedRadians < 0) {
			normalizedRadians += twoPi;
		}
		return new Angle(normalizedRadians);
	}

	public add(other: Angle): Angle {
		return new Angle(this._radians + other._radians);
	}

	public subtract(other: Angle): Angle {
		return new Angle(this._radians - other._radians);
	}

	public addDegrees(degrees: number): Angle {
		return this.add(Angle.fromDegrees(degrees));
	}

	public addRadians(radians: number): Angle {
		return this.add(Angle.fromRadians(radians));
	}

	public multiply(factor: number): Angle {
		return new Angle(this._radians * factor, AngleUnit.Radians);
	}

	get sin(): number {
		if (this.sinCache) return this.sinCache;

		const sin = Math.sin(this._radians);
		this.sinCache = sin;
		return sin;
	}

	get cos(): number {
		if (this.cosCache) return this.cosCache;

		const cos = Math.cos(this._radians);
		this.cosCache = cos;
		return cos;
	}

	get tan(): number {
		if (this.tanCache) return this.tanCache;

		const tan = Math.tan(this._radians);
		this.tanCache = tan;
		return tan;
	}

	get ctan(): number {
		if (this.tanCache) return 1 / this.tanCache;

		const tan = Math.tan(this._radians);
		this.tanCache = tan;
		return 1 / tan;
	}
}
