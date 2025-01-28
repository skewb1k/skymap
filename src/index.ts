import constellationsLinesData from "../data/constellations.lines.json";
import starsData from "../data/stars.6.json";
import { Angle } from "./Angle";
import AstronomicalTime from "./AstronomicalTime/AstronomicalTime";
import equatorialToHorizontal from "./helper/equatorialToHorizontal";
import { bvToRGB } from "./helper/color";
import type { Constellation } from "./types/Constellation.type";
import type { Coo } from "./types/Coo.type";
import type { Star } from "./types/Star.type";
import type { StarsData } from "./types/StarsData.type";

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
	constellationColor?: string;
	constellationWidth?: number;
	showConstellations?: boolean;
};

export class SkyMap {
	private container: HTMLDivElement;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	private radius: number;
	private center: Coo;
	private latitude: Angle;
	private longitude: Angle;
	private datetime: AstronomicalTime;
	private fov: number;
	private lst: Angle;

	private scaleMod: number;

	private gridColor: string;
	private gridWidth: number;
	private starColor: string;
	private bgColor: string;
	private borderColor: string;
	private borderWidth: number;
	private constellationColor: string;
	private constellationWidth: number;

	private stars: StarsData;
	private constellationsLines: Constellation[];

	private starColors: boolean;

	constructor(container: HTMLDivElement, options: SkyMapOptions = {}) {
		const {
			latitude = 0,
			longitude = 0,
			datetime = new Date(),
			fov = 90,
			gridColor = "#333",
			gridWidth = 4,
			starColor = "#ffffff",
			bgColor = "#000000",
			borderColor = "#f00",
			borderWidth = 3,
			starColors = false,
			constellationColor = "#ffffff",
			constellationWidth = 1,
		} = options;

		this.container = container;

		this.canvas = document.createElement("canvas");
		this.canvas.width = this.container.offsetWidth;
		this.canvas.height = this.container.offsetHeight;
		this.container.appendChild(this.canvas);

		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

		this.radius = Math.min(this.canvas.width, this.canvas.height) / 2;
		this.center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };

		this.gridColor = gridColor;
		this.gridWidth = gridWidth;
		this.starColor = starColor;
		this.bgColor = bgColor;
		this.borderColor = borderColor;
		this.borderWidth = borderWidth;
		this.constellationColor = constellationColor;
		this.constellationWidth = constellationWidth;
		this.starColors = starColors;

		this.latitude = Angle.fromDegrees(latitude);
		this.longitude = Angle.fromDegrees(longitude);
		this.datetime = AstronomicalTime.fromUTCDate(datetime);
		this.fov = fov;

		this.lst = this.datetime.LST(this.longitude);

		this.scaleMod = this.radius / 500;

		this.stars = starsData;
		this.constellationsLines = constellationsLinesData.map((constellation) => ({
			...constellation,
			vertices: constellation.vertices.map((group) =>
				group.map((pair) => pair as [number, number]),
			),
		}));

		this.ctx.beginPath();
		this.arcCircle(this.center, this.radius);
		this.ctx.clip();
		this.ctx.closePath();

		this.render();
	}

	setLatitude(latitude: number): this {
		this.latitude = Angle.fromDegrees(latitude);
		this.render();
		return this;
	}

	setLongitude(longitude: number): this {
		this.longitude = Angle.fromDegrees(longitude);
		this.updateLST();
		this.render();
		return this;
	}

	setDatetime(datetime: Date): this {
		this.datetime = AstronomicalTime.fromUTCDate(datetime);
		this.updateLST();
		this.render();
		return this;
	}

	private updateLST() {
		this.lst = this.datetime.LST(this.longitude);
	}

	private render(): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawBg();
		this.drawGrid();
		// this.drawStars();
		// this.drawConstellations();
	}

	private arcCircle(coo: Coo, radius: number): void {
		this.ctx.arc(coo.x, coo.y, radius, 0, Math.PI * 2);
	}

	// private drawConstellations(): void {
	// 	this.constellationsLines.forEach((constellation) => {
	// 		if (constellation.id === "UMi") {
	// 			this.drawConstellation(constellation);
	// 		}
	// 	});
	// }

	private drawCircle(
		coo: Coo,
		radius: number,
		color: string,
		width: number,
	): void {
		this.ctx.beginPath();
		const wi = width * this.scaleMod;
		this.ctx.lineWidth = wi;
		this.ctx.strokeStyle = color;
		this.arcCircle(coo, radius - wi / 2);
		this.ctx.stroke();
		this.ctx.closePath();
	}

	private drawDisk(coo: Coo, radius: number, color: string): void {
		this.ctx.beginPath();
		this.ctx.fillStyle = color;
		this.arcCircle(coo, radius);
		this.ctx.fill();
		this.ctx.closePath();
	}

	private drawBg(): void {
		this.drawDisk(
			{ x: this.radius, y: this.radius },
			this.radius,
			this.bgColor,
		);
	}

	// private drawStars(): void {
	// this.stars.stars.forEach((star) => {
	// 	this.drawStar(star);
	// });
	// }

	// private drawConstellation(constellation: Constellation): void {
	// 	this.ctx.strokeStyle = this.constellationColor;
	// 	this.ctx.lineWidth = this.constellationWidth * this.scaleMod;

	// 	this.ctx.beginPath();
	// 	constellation.vertices.forEach((segment) => {
	// 		segment.forEach((point, index) => {
	// 			const [ra, dec] = point;
	// 			const coords = equatorialToHorizontal(
	// 				this.lst.add(Angle.fromDegrees(ra)),
	// 				Angle.fromDegrees(dec),
	// 				this.latitude,
	// 			);

	// 			const projectedPoint = this.project(coords.altitude, coords.azimuth);

	// 			if (index === 0) {
	// 				this.ctx.moveTo(projectedPoint.coo.x, projectedPoint.coo.y);
	// 			} else {
	// 				this.ctx.lineTo(projectedPoint.coo.x, projectedPoint.coo.y);
	// 			}
	// 		});
	// 	});
	// 	this.ctx.stroke();
	// }

	private moveTo(p: Coo) {
		this.ctx.moveTo(p.x, p.y);
	}

	private lineTo(p: Coo) {
		this.ctx.lineTo(p.x, p.y);
	}

	private project(alt: Angle, az: Angle): Coo {
		const r = (this.radius * (90 - alt.degrees)) / 90;
		return {
			x: this.center.x + r * az.sin,
			y: this.center.y - r * az.cos,
		};
	}

	private drawGrid() {
		this.ctx.lineWidth = this.gridWidth * this.scaleMod;
		this.ctx.strokeStyle = this.gridColor;

		for (let raDeg = 0; raDeg < 360; raDeg += 15) {
			const ra = Angle.fromDegrees(raDeg);
			this.ctx.beginPath();

			for (
				let decDeg = raDeg % 90 === 0 ? -90 : -80;
				decDeg <= (raDeg % 90 === 0 ? 90 : 80);
				decDeg += 2
			) {
				const dec = Angle.fromDegrees(decDeg);
				const { alt, az } = equatorialToHorizontal(
					ra,
					dec,
					this.latitude,
					this.lst,
				);

				if (this.latitude.degrees === 0) {
					if (alt.degrees < 0) {
						continue;
					}
				} else {
					if (alt.degrees < -1) {
						continue;
					}
				}

				const coo = this.project(alt, az);
				this.lineTo(coo);
			}

			this.ctx.stroke();
		}

		for (let decDeg = -80; decDeg <= 80; decDeg += 20) {
			const dec = Angle.fromDegrees(decDeg);
			this.ctx.beginPath();
			let firstPointVisible = false;

			for (let raDeg = 0; raDeg <= 360; raDeg += 2) {
				const ra = Angle.fromDegrees(raDeg);

				const { alt, az } = equatorialToHorizontal(
					ra,
					dec,
					this.latitude,
					this.lst,
				);

				if (alt.degrees < -2) {
					firstPointVisible = false;
					continue;
				}

				const coo = this.project(alt, az);
				if (!firstPointVisible) {
					this.moveTo(coo);
					firstPointVisible = true;
				} else {
					this.lineTo(coo);
				}
			}

			this.ctx.stroke();
		}
	}

	// private drawStar(star: Star): void {
	// 	const starRa = Angle.fromDegrees(star.lon);
	// 	const starDec = Angle.fromDegrees(star.lat);

	// 	const hourAngle = this.lst.subtract(starRa).normalize();
	// 	const coords = equatorialToHorizontal(hourAngle, starDec, this.latitude);
	// 	const point = this.project(coords.altitude, coords.azimuth);

	// 	if (point.visible) {
	// 		// star with mag = -1.44 will have size 4
	// 		const size = (6 / 1.2 ** (star.mag + this.stars.mag.max)) * this.scaleMod;

	// 		const color = this.starColors ? bvToRGB(star.bv) : this.starColor;

	// 		this.drawDisk(point.coo, size, color);
	// 	}
	// }
}
