import { Angle } from "./Angle";

type Coo = {
	x: number;
	y: number;
};

type SkyMapOptions = {
	latitude?: number;
	longitude?: number;
	datetime?: Date;
	fov?: number;
};

export class SkyMap {
	private container: HTMLDivElement;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	private radius: number;
	private center: Coo;
	private latitude: number;
	private longitude: number;
	private datetime: Date;
	private azimuth: Angle;
	private altitude: Angle;
	private fov: number;

	constructor(container: HTMLDivElement, options: SkyMapOptions = {}) {
		const {
			latitude = 0,
			longitude = 0,
			datetime = new Date(),
			fov = 90,
		} = options;

		this.container = container;

		this.canvas = document.createElement("canvas");
		this.canvas.width = this.container.offsetWidth;
		this.canvas.height = this.container.offsetHeight;
		this.container.appendChild(this.canvas);

		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

		this.radius = Math.min(this.canvas.width, this.canvas.height) / 2;
		this.center = {
			x: this.canvas.width / 2,
			y: this.canvas.height / 2,
		};

		this.latitude = latitude;
		this.longitude = longitude;
		this.datetime = datetime;
		this.fov = fov;
		this.altitude = Angle.fromDegrees(50);
		this.azimuth = Angle.fromDegrees(100);

		this.drawBg();
		this.drawGrid();
	}

	private drawCircle(coo: Coo, radius: number, color: string, width = 1) {
		this.ctx.lineWidth = width;
		this.ctx.strokeStyle = color;
		this.ctx.arc(coo.x, coo.y, radius, 0, Math.PI * 2);
	}

	private drawBg() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear previous drawings
		this.ctx.beginPath();
		this.drawCircle(this.center, this.radius, "black");
		this.ctx.fill();
	}

	// todo: move out
	private julianDate(date: Date): number {
		return date.getTime() / 86400000.0 + 2440587.5;
	}

	// Approximate calculation for sidereal time in degrees
	private getLocalSiderealTime(): Angle {
		const J2000 = 2451545.0; // Julian date for 2000-01-01 12:00:00 TT
		const julianDate = this.julianDate(this.datetime);
		const centuries = (julianDate - J2000) / 36525.0; // Julian Century
		const theta0 =
			(280.46061837 +
				360.98564736629 * (julianDate - 2451545) +
				centuries * centuries * 0.000387933 -
				(centuries * centuries * centuries) / 38710000) %
			360;
		return Angle.fromDegrees((theta0 + this.longitude) % 360);
	}

	private project(
		alt: Angle,
		az: Angle,
	): {
		x: number;
		y: number;
		visible: boolean;
	} {
		const x = alt.cos * az.sin;
		const y = alt.cos * az.cos;
		const z = alt.sin;

		const rotX = x;
		const rotY = y * this.altitude.cos - z * this.altitude.sin;
		const rotZ = y * this.altitude.sin + z * this.altitude.cos;

		const finalX = rotX * this.azimuth.cos - rotY * this.azimuth.sin;
		const finalY = rotX * this.azimuth.sin + rotY * this.azimuth.cos;
		const finalZ = rotZ;

		const scale =
			(this.radius * 2) / (2 * Math.tan((this.fov * Math.PI) / 360));
		const projX = (finalX / (1 + finalZ)) * scale + this.radius;
		const projY = (finalY / (1 + finalZ)) * scale + this.radius;

		return { x: projX, y: projY, visible: finalZ > -0.99 };
	}

	private drawGrid() {
		const lst = this.getLocalSiderealTime();

		// Create clipping region to limit drawing to circle
		this.ctx.save();
		this.ctx.beginPath();
		this.drawCircle(this.center, this.radius, "white");
		this.ctx.clip();

		// Draw equatorial grid rotated by LST
		for (let decDeg = -80; decDeg <= 80; decDeg += 10) {
			const dec = Angle.fromDegrees(decDeg);
			this.ctx.beginPath();
			let firstPoint = true;

			for (let raDeg = 0; raDeg <= 360; raDeg += 5) {
				const ra = Angle.fromDegrees(raDeg);
				// Convert equatorial to horizontal coordinates
				const ha = lst.subtract(ra);
				const coords = this.equatorialToHorizontal(ha, dec);
				const point = this.project(coords.altitude, coords.azimuth);

				if (point.visible) {
					if (firstPoint) {
						this.ctx.moveTo(point.x, point.y);
						firstPoint = false;
					} else {
						this.ctx.lineTo(point.x, point.y);
					}
				}
			}
			this.ctx.strokeStyle = "#444444";
			this.ctx.stroke();
		}

		// Draw right ascension lines
		for (let raDeg = 0; raDeg < 360; raDeg += 15) {
			const ra = Angle.fromDegrees(raDeg);
			this.ctx.beginPath();
			let firstPoint = true;

			for (let decDeg = -90; decDeg <= 90; decDeg += 5) {
				const dec = Angle.fromDegrees(decDeg);
				const ha = lst.subtract(ra);
				const coords = this.equatorialToHorizontal(ha, dec);
				const point = this.project(coords.altitude, coords.azimuth);

				if (point.visible) {
					if (firstPoint) {
						this.ctx.moveTo(point.x, point.y);
						firstPoint = false;
					} else {
						this.ctx.lineTo(point.x, point.y);
					}
				}
			}
			this.ctx.strokeStyle = "#444444";
			this.ctx.stroke();
		}

		// Draw celestial equator in different color
		// this.ctx.beginPath();
		// let firstPoint = true;
		// for (let ra = 0; ra <= 360; ra += 5) {
		// 	const ha = lst - ra;
		// 	const coords = this.equatorialToHorizontal(ha, 0);
		// 	const point = this.project(coords.alt, coords.az);

		// 	if (point?.visible) {
		// 		if (firstPoint) {
		// 			this.ctx.moveTo(point.x, point.y);
		// 			firstPoint = false;
		// 		} else {
		// 			this.ctx.lineTo(point.x, point.y);
		// 		}
		// 	}
		// }
		// this.ctx.strokeStyle = "#666699";
		// this.ctx.stroke();

		// this.ctx.restore();

		// Draw the boundary circle
		this.ctx.beginPath();
		this.drawCircle({ x: this.radius, y: this.radius }, this.radius, "#f00", 4);
		this.ctx.stroke();
	}

	private equatorialToHorizontal(
		hourAngle: Angle,
		declination: Angle,
	): {
		altitude: Angle;
		azimuth: Angle;
	} {
		const observerLatitudeRad = Angle.fromDegrees(this.latitude); //todo latitude angle

		// Calculate altitude
		const sinAltitude =
			observerLatitudeRad.sin * declination.sin +
			observerLatitudeRad.cos * declination.cos * hourAngle.cos;
		const altitude = Angle.fromRadians(Math.asin(sinAltitude));

		// Calculate azimuth
		const cosAzimuth =
			(declination.sin - observerLatitudeRad.sin * sinAltitude) /
			(observerLatitudeRad.cos * Math.cos(Math.asin(sinAltitude)));

		// Clamp cosAzimuth to [-1,1] and convert to degrees
		const baseAzimuth = Angle.fromRadians(
			Math.acos(Math.max(-1, Math.min(1, cosAzimuth))),
		);

		// Determine final azimuth based on hour angle
		const finalAzimuth =
			hourAngle.sin > 0
				? baseAzimuth.subtract(Angle.fromDegrees(360))
				: baseAzimuth;

		return {
			altitude,
			azimuth: finalAzimuth,
		};
	}
}
