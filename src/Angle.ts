enum AngleUnit {
	Degrees = 0,
	Radians = 1,
}

export class Angle {
	private readonly _radians: number;

	private constructor(value: number, unit = AngleUnit.Degrees) {
		this._radians =
			unit === AngleUnit.Degrees ? (value * Math.PI) / 180 : value;
	}

	get degrees(): number {
		return (this._radians * 180) / Math.PI;
	}

	get radians(): number {
		return this._radians;
	}

	static fromDegrees(degrees: number): Angle {
		return new Angle(degrees, AngleUnit.Degrees);
	}

	static fromRadians(radians: number): Angle {
		return new Angle(radians, AngleUnit.Radians);
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
