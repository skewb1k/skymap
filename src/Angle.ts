enum AngleUnit {
	Degrees = 0,
	Radians = 1,
	Hours = 2,
}

export class Angle {
	private readonly _radians: number;

	private constructor(value: number, unit = AngleUnit.Degrees) {
		this._radians =
			unit === AngleUnit.Degrees
				? (value * Math.PI) / 180
				: unit === AngleUnit.Hours
					? (value * Math.PI) / 12
					: value;
	}

	get degrees(): number {
		return (this._radians * 180) / Math.PI;
	}

	get radians(): number {
		return this._radians;
	}

	get hours(): number {
		return (this._radians * 12) / Math.PI;
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
		return new Angle(normalizedRadians, AngleUnit.Radians);
	}

	add(other: Angle): Angle {
		return new Angle(this._radians + other._radians, AngleUnit.Radians);
	}

	subtract(other: Angle): Angle {
		return new Angle(this._radians - other._radians, AngleUnit.Radians);
	}

	addDegrees(degrees: number): Angle {
		return this.add(Angle.fromDegrees(degrees));
	}

	addRadians(radians: number): Angle {
		return this.add(Angle.fromRadians(radians));
	}

	get sin(): number {
		return Math.sin(this._radians);
	}

	get cos(): number {
		return Math.cos(this._radians);
	}

	get tan(): number {
		return Math.tan(this._radians);
	}

	get ctan(): number {
		return 1 / Math.tan(this._radians);
	}
}
