import stars from "../data/stars.6.json";
import { Angle } from "./Angle";
import { getLocalSiderealTime } from "./date";
import { equatorialToHorizontal } from "./helper/angle";
import type { Coo } from "./types/Coo.type";
import type { Star } from "./types/Star.type";

type SkyMapOptions = {
	latitude?: number;
	longitude?: number;
	datetime?: Date;
	fov?: number;
	gridColor?: string;
	gridWidth?: number;
	starColor?: string;
	bgColor?: string;
	borderColor?: string;
	borderWidth?: number;
	starColors?: boolean; //? rename
};

export class SkyMap {
	private container: HTMLDivElement;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	private radius: number;
	private center: Coo;
	private latitude: Angle;
	private longitude: Angle;
	private datetime: Date;
	private azimuth: Angle;
	private altitude: Angle;
	private fov: number;

	private scaleMod: number;

	private gridColor: string;
	private gridWidth: number;
	private starColor: string;
	private bgColor: string;
	private borderColor: string;
	private borderWidth: number;

	private stars: Star[];

	private starColors: boolean;

	constructor(container: HTMLDivElement, options: SkyMapOptions = {}) {
		const {
			latitude = 0,
			longitude = 0,
			datetime = new Date(),
			fov = 90,
			gridColor = "#444444",
			gridWidth = 2,
			starColor = "#ffffff",
			bgColor = "#000000",
			borderColor = "#f00",
			borderWidth = 4,
			starColors = false,
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

		this.gridColor = gridColor;
		this.gridWidth = gridWidth;
		this.starColor = starColor;
		this.bgColor = bgColor;
		this.borderColor = borderColor;
		this.borderWidth = borderWidth;

		this.latitude = Angle.fromDegrees(latitude);
		this.longitude = Angle.fromDegrees(longitude);
		this.datetime = datetime;
		this.fov = fov;
		this.altitude = Angle.fromDegrees(0);
		this.azimuth = Angle.fromDegrees(0);

		this.scaleMod = this.radius / 500;

		this.stars = stars;

		this.drawBg();
		this.drawGrid();

		this.drawStars();
	}

	private arcCircle(coo: Coo, radius: number): void {
		this.ctx.arc(coo.x, coo.y, radius, 0, Math.PI * 2);
	}

	private drawCircle(
		coo: Coo,
		radius: number,
		color: string,
		width: number,
	): void {
		this.ctx.beginPath();
		this.ctx.lineWidth = width * this.scaleMod;
		this.ctx.strokeStyle = color;
		this.arcCircle(coo, radius);
		this.ctx.stroke();
	}

	private drawDisk(coo: Coo, radius: number, color: string): void {
		this.ctx.beginPath();
		this.ctx.fillStyle = color;
		this.arcCircle(coo, radius);
		this.ctx.fill();
	}

	private drawBg(): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawDisk(this.center, this.radius, this.bgColor);
	}

	private drawStars(): void {
		stars.forEach((star) => {
			this.drawStar(
				Angle.fromDegrees(star.lon),
				Angle.fromDegrees(star.lat),
				star.mag,
				star.bv,
			);
		});
	}

	// Approximate calculation for sidereal time in degrees
	private project(
		alt: Angle,
		az: Angle,
	): {
		coo: Coo;
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

		return { coo: { x: projX, y: projY }, visible: finalZ > -0.99 };
	}

	private drawGrid() {
		const lst = getLocalSiderealTime(this.datetime, this.longitude);

		// Create clipping region to limit drawing to circle
		this.ctx.save();
		this.ctx.beginPath();
		this.arcCircle(this.center, this.radius);
		this.ctx.clip();

		this.ctx.lineWidth = this.gridWidth * this.scaleMod;
		this.ctx.strokeStyle = this.gridColor;

		for (let decDeg = -80; decDeg <= 80; decDeg += 10) {
			const declination = Angle.fromDegrees(decDeg);
			this.ctx.beginPath();
			let firstPoint = true;

			for (let raDeg = 0; raDeg <= 360; raDeg += 5) {
				const ra = Angle.fromDegrees(raDeg);
				const ha = lst.subtract(ra);
				const coords = equatorialToHorizontal(ha, declination, this.latitude);
				const point = this.project(coords.altitude, coords.azimuth);

				if (point.visible) {
					if (firstPoint) {
						this.ctx.moveTo(point.coo.x, point.coo.y);
						firstPoint = false;
					} else {
						this.ctx.lineTo(point.coo.x, point.coo.y);
					}
				}
			}
			this.ctx.stroke();
		}

		for (let raDeg = 0; raDeg < 360; raDeg += 15) {
			const ra = Angle.fromDegrees(raDeg);
			this.ctx.beginPath();
			let firstPoint = true;

			for (
				let decDeg = -90;
				decDeg <= (raDeg % 90 === 0 ? 90 : 80);
				decDeg += 5
			) {
				const declination = Angle.fromDegrees(decDeg);
				const ha = lst.subtract(ra);
				const coords = equatorialToHorizontal(ha, declination, this.latitude);
				const point = this.project(coords.altitude, coords.azimuth);

				if (point.visible) {
					if (firstPoint) {
						this.ctx.moveTo(point.coo.x, point.coo.y);
						firstPoint = false;
					} else {
						this.ctx.lineTo(point.coo.x, point.coo.y);
					}
				}
			}
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
		this.drawCircle(
			{ x: this.radius, y: this.radius },
			this.radius,
			this.borderColor,
			this.borderWidth,
		);
	}

	private bvToRGB(bv: number): string {
		// B-V color index to RGB conversion
		// Based on realistic stellar color transformation
		const temp = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

		let r = 0;
		let g = 0;
		let b = 0;

		if (temp <= 6000) {
			// todo: adjust colors, maybe accound magnitude
			r = 1;
			g = 0.3 * Math.log(temp / 100 - 10);
			b = 0.5;
		} else {
			r = 1.0;
			g = 0.9;
			b = 0.4 * Math.log(temp / 100 - 56);
		}

		// console.log(Math.round(r * 255));
		// Ensure values are within 0-255 range
		r = Math.max(0, Math.min(255, Math.round(r * 255)));
		g = Math.max(0, Math.min(255, Math.round(g * 255)));
		b = Math.max(0, Math.min(255, Math.round(b * 255)));

		return `rgb(${r}, ${g}, ${b})`;
	}

	private drawStar(ra: Angle, dec: Angle, magnitude: number, bv: number): void {
		const lst = getLocalSiderealTime(this.datetime, this.longitude);
		const ha = lst.subtract(ra);
		const coords = equatorialToHorizontal(ha, dec, this.latitude);
		const point = this.project(coords.altitude, coords.azimuth);

		if (point.visible) {
			const size = (6 - magnitude) * 0.5 * this.scaleMod; // todo: custom max mag

			const color = this.starColors ? this.bvToRGB(bv) : this.starColor;

			this.drawDisk(point.coo, size, color);
		}
	}
}
