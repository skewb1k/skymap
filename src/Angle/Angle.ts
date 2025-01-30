enum AngleUnit {
	Degrees = 0,
	Radians = 1,
	Hours = 2,
}

export default class Angle {
	private readonly _radians: number;

	private degrees_cache: number | undefined;
	private hours_cache: number | undefined;
	private sin_cache: number | undefined;
	private cos_cache: number | undefined;
	private tan_cache: number | undefined;

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

	multiply(factor: number): Angle {
		return new Angle(this._radians * factor, AngleUnit.Radians);
	}

	get degrees(): number {
		if (this.degrees_cache) return this.degrees_cache;

		const degrees = this.radToDeg(this._radians);
		this.degrees_cache = degrees;
		return degrees;
	}

	get radians(): number {
		return this._radians;
	}

	get hours(): number {
		if (this.hours_cache) return this.hours_cache;

		const hours = this.radToHours(this._radians);
		this.hours_cache = hours;
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
	normalize(): Angle {
		const twoPi = 2 * Math.PI;
		let normalizedRadians = this._radians % twoPi;
		if (normalizedRadians < 0) {
			normalizedRadians += twoPi;
		}
		return new Angle(normalizedRadians);
	}

	add(other: Angle): Angle {
		return new Angle(this._radians + other._radians);
	}

	subtract(other: Angle): Angle {
		return new Angle(this._radians - other._radians);
	}

	addDegrees(degrees: number): Angle {
		return this.add(Angle.fromDegrees(degrees));
	}

	addRadians(radians: number): Angle {
		return this.add(Angle.fromRadians(radians));
	}

	get sin(): number {
		if (this.sin_cache) return this.sin_cache;

		const sin = Math.sin(this._radians);
		this.sin_cache = sin;
		return sin;
	}

	get cos(): number {
		if (this.cos_cache) return this.cos_cache;

		const cos = Math.cos(this._radians);
		this.cos_cache = cos;
		return cos;
	}

	get tan(): number {
		if (this.tan_cache) return this.tan_cache;

		const tan = Math.tan(this._radians);
		this.tan_cache = tan;
		return tan;
	}

	get ctan(): number {
		if (this.tan_cache) return 1 / this.tan_cache;

		const tan = Math.tan(this._radians);
		this.tan_cache = tan;
		return 1 / tan;
	}
}
