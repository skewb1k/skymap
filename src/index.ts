import { toRadians } from "./helper/toRadians";

type Coo = {
	x: number;
	y: number;
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
	private azimuth: number;
	private altitude: number;
	private fov: number;

	constructor(
		container: HTMLDivElement,
		{
			latitude,
			longitude,
			datetime,
			azimuth,
			altitude,
			fov,
		}: {
			latitude: number;
			longitude: number;
			datetime: Date;
			azimuth: number;
			altitude: number;
			fov: number;
		},
	) {
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

		this.latitude = latitude || 0;
		this.longitude = longitude || 0;
		this.datetime = datetime || new Date();
		this.azimuth = azimuth || 0;
		this.altitude = altitude || 0;
		this.fov = fov || 90;

		this.drawBg();
		this.drawGrid();
	}

	private drawCircle(coo: Coo, radius: number) {
		this.ctx.arc(coo.x, coo.y, radius, 0, Math.PI * 2);
	}

	private drawBg() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear previous drawings
		this.ctx.beginPath();
		this.drawCircle(this.center, this.radius);
		this.ctx.fillStyle = "#000"; // Black color
		this.ctx.fill();
	}

	private julianDate(date: Date): number {
		return date.getTime() / 86400000.0 + 2440587.5;
	}

	// Approximate calculation for sidereal time in degrees
	private getLocalSiderealTime(): number {
		const J2000 = 2451545.0; // Julian date for 2000-01-01 12:00:00 TT
		const julianDate = this.julianDate(this.datetime);
		const centuries = (julianDate - J2000) / 36525.0; // Julian Century
		const theta0 =
			(280.46061837 +
				360.98564736629 * (julianDate - 2451545) +
				centuries * centuries * 0.000387933 -
				(centuries * centuries * centuries) / 38710000) %
			360;
		return (theta0 + this.longitude) % 360;
	}

	private project(alt: number, az: number) {
		// Convert spherical to cartesian
		const altRad = (alt * Math.PI) / 180;
		const azRad = (az * Math.PI) / 180;

		const x = Math.cos(altRad) * Math.sin(azRad);
		const y = Math.cos(altRad) * Math.cos(azRad);
		const z = Math.sin(altRad);

		// Apply viewer rotation
		const viewAltRad = (this.altitude * Math.PI) / 180;
		const viewAzRad = (this.azimuth * Math.PI) / 180;

		const rotX = x;
		const rotY = y * Math.cos(viewAltRad) - z * Math.sin(viewAltRad);
		const rotZ = y * Math.sin(viewAltRad) + z * Math.cos(viewAltRad);

		const finalX = rotX * Math.cos(viewAzRad) - rotY * Math.sin(viewAzRad);
		const finalY = rotX * Math.sin(viewAzRad) + rotY * Math.cos(viewAzRad);
		const finalZ = rotZ;

		// Project to 2D using stereographic projection
		if (finalZ < -0.99) return null; // Behind viewer

		const scale =
			(this.radius * 2) / (2 * Math.tan((this.fov * Math.PI) / 360));
		const projX = (finalX / (1 + finalZ)) * scale + this.radius;
		const projY = (finalY / (1 + finalZ)) * scale + this.radius;

		const dx = projX - this.radius;
		const dy = projY - this.radius;
		const distance = Math.sqrt(dx * dx + dy * dy);

		// console.log(distance, this.radius);
		// if (distance - 10000 > this.radius) return null;

		return { x: projX, y: projY, visible: finalZ > -0.99 };
	}

	private drawGrid() {
		const lst = this.getLocalSiderealTime();

		// Create clipping region
		this.ctx.save();
		this.ctx.beginPath();
		this.drawCircle(this.center, this.radius);
		this.ctx.clip();

		// Draw equatorial grid rotated by LST
		for (let dec = -80; dec <= 80; dec += 10) {
			this.ctx.beginPath();
			let firstPoint = true;

			for (let ra = 0; ra <= 360; ra += 5) {
				// Convert equatorial to horizontal coordinates
				const ha = lst - ra;
				const coords = this.equatorialToHorizontal(ha, dec);
				const point = this.project(coords.alt, coords.az);

				if (point?.visible) {
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
		for (let ra = 0; ra < 360; ra += 15) {
			this.ctx.beginPath();
			let firstPoint = true;

			for (let dec = -90; dec <= 90; dec += 5) {
				const ha = lst - ra;
				const coords = this.equatorialToHorizontal(ha, dec);
				const point = this.project(coords.alt, coords.az);

				if (point?.visible) {
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

		this.ctx.restore();

		// Draw the boundary circle
		this.ctx.beginPath();
		this.drawCircle({ x: this.radius, y: this.radius }, this.radius);
		this.ctx.strokeStyle = "#444444";
		this.ctx.stroke();
	}

	private equatorialToHorizontal(ha: number, dec: number) {
		const lat = (this.latitude * Math.PI) / 180;
		const haRad = (ha * Math.PI) / 180;
		const decRad = (dec * Math.PI) / 180;

		const sinAlt =
			Math.sin(lat) * Math.sin(decRad) +
			Math.cos(lat) * Math.cos(decRad) * Math.cos(haRad);
		const alt = (Math.asin(sinAlt) * 180) / Math.PI;

		const cosAz =
			(Math.sin(decRad) - Math.sin(lat) * sinAlt) /
			(Math.cos(lat) * Math.cos(Math.asin(sinAlt)));
		const az = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI;

		return { alt, az: Math.sin(haRad) > 0 ? 360 - az : az };
	}
}
