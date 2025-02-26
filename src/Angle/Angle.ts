import { degToRad, radToDeg } from "./angleconv";

export default class Angle {
	public deg: number;
	public ra: number;

	constructor({ deg, ra }: { deg: number; ra: number }) {
		this.deg = deg;
		this.ra = ra;
	}

	public static fromDegrees(deg: number): Angle {
		const normalizedDegrees = deg % 360;
		return new Angle({
			deg: normalizedDegrees,
			ra: degToRad(normalizedDegrees),
		});
	}

	public static fromRadians(ra: number): Angle {
		return new Angle({
			deg: radToDeg(ra),
			ra: ra,
		});
	}
}
