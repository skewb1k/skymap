import { degToRad, radToDeg } from "./angleconv";

export default class Angle {
	public deg: number;
	public ra: number;

	constructor({ deg, ra }: { deg: number; ra: number }) {
		this.deg = deg;
		this.ra = ra;
	}

	public static fromDegrees(deg: number): Angle {
		return new Angle({
			deg: deg,
			ra: degToRad(deg),
		});
	}

	public static fromRadians(ra: number): Angle {
		return new Angle({
			deg: radToDeg(ra),
			ra: ra,
		});
	}
}
