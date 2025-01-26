import { Angle } from "./Angle";
import { getLocalSiderealTime } from "./date";
import { equatorialToHorizontal } from "./helper/angle";
import type { Coo } from "./types/Coo.type";
import stars from "../data/stars.6.json";
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

	private drawCircle(coo: Coo, radius: number, color: string, width = 1): void {
		this.ctx.lineWidth = width * this.scaleMod;
		this.ctx.strokeStyle = color;
		this.ctx.arc(coo.x, coo.y, radius, 0, Math.PI * 2);
	}

	private drawBg(): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear previous drawings
		this.ctx.beginPath();
		this.drawCircle(this.center, this.radius, this.bgColor);
		this.ctx.fill();
	}

	private drawStars(): void {
		stars.forEach((star) => {
			this.drawStar(
				Angle.fromDegrees(star.lon),
				Angle.fromDegrees(star.lat),
				star.mag,
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
		this.drawCircle(this.center, this.radius, "white");
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
		this.ctx.beginPath();
		this.drawCircle(
			{ x: this.radius, y: this.radius },
			this.radius,
			this.borderColor,
			this.borderWidth,
		);
		this.ctx.stroke();
	}

	private drawStar(ra: Angle, dec: Angle, magnitude: number): void {
		const lst = getLocalSiderealTime(this.datetime, this.longitude);
		const ha = lst.subtract(ra);
		const coords = equatorialToHorizontal(ha, dec, this.latitude);
		const point = this.project(coords.altitude, coords.azimuth);

		if (point.visible) {
			const size = (6 - magnitude) * 0.5 * this.scaleMod; // todo: custom max mag

			this.ctx.beginPath();
			this.ctx.fillStyle = this.starColor;
			this.drawCircle(point.coo, size, this.starColor);
			this.ctx.fill();
		}
	}
}
