export class Angle {
	private _radians: number;

	constructor(value: number, unit: "deg" | "rad" = "deg") {
		this._radians = unit === "deg" ? (value * Math.PI) / 180 : value;
	}

	get degrees(): number {
		return (this._radians * 180) / Math.PI;
	}

	get radians(): number {
		return this._radians;
	}

	static fromDegrees(degrees: number): Angle {
		return new Angle(degrees, "deg");
	}

	static fromRadians(radians: number): Angle {
		return new Angle(radians, "rad");
	}

	add(other: Angle): Angle {
		return new Angle(this._radians + other._radians, "rad");
	}

	subtract(other: Angle): Angle {
		return new Angle(this._radians - other._radians, "rad");
	}

	get sin(): number {
		return Math.sin(this._radians);
	}

	get cos(): number {
		return Math.cos(this._radians);
	}
}
