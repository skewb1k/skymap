import constellationsBordersData from "../data/constellations.borders.json";
import constellationsLinesData from "../data/constellations.lines.json";
import starsData from "../data/stars.6.json";
import { Angle } from "./Angle";
import AstronomicalTime from "./AstronomicalTime/AstronomicalTime";
import { bvToRGB } from "./helper/color";
import equatorialToHorizontal from "./helper/equatorialToHorizontal";
import type { ConstellationBorder, ConstellationLine } from "./types/Constellation.type";
import type { Coo } from "./types/Coo.type";
import type { Star } from "./types/Star.type";
import type { StarsData } from "./types/StarsData.type";

type ColorConfig = {
	gridColor: string;
	starColor: string;
	bgColor: string;
	constellationLinesColor: string;
	constellationBordersColor: string;
	starsTemperature: boolean; //? rename
};

type LinesConfig = {
	constellationLinesWidth: number;
	constellationBordersWidth: number;
	gridWidth: number;
};

type SkyMapOptions = {
	latitude?: number;
	longitude?: number;
	datetime?: Date;
	fov?: number;
	showConstellationsLines?: boolean;
	showConstellationsBorders?: boolean;
	showStars?: boolean;
	showGrid?: boolean;
	colorConfig?: Partial<ColorConfig>;
	linesConfig?: Partial<LinesConfig>;
};

export class SkyMap {
	private container: HTMLDivElement;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	private scaleMod: number;

	private radius: number;
	private center: Coo;
	private latitude: Angle;
	private longitude: Angle;
	private datetime: AstronomicalTime;
	private fov: number;
	private fovFactor: number;
	private lst: Angle;

	private showConstellationsLines: boolean;
	private showConstellationsBorders: boolean;
	private showStars: boolean;
	private showGrid: boolean;

	private colorConfig: ColorConfig;
	private linesConfig: LinesConfig;

	private stars: StarsData;
	private constellationsLines: ConstellationLine[];
	private constellationsBorders: ConstellationBorder[];

	constructor(container: HTMLDivElement, options: SkyMapOptions = {}) {
		const {
			latitude = 0,
			longitude = 0,
			datetime = new Date(),
			showConstellationsBorders = false,
			showConstellationsLines = true,
			showStars = true,
			showGrid = true,
			fov = 180,
		} = options;

		this.container = container;
		this.colorConfig = {
			gridColor: "#333",
			starColor: "#fefefe",
			bgColor: "#000000",
			starsTemperature: false,
			constellationLinesColor: "rgba(100, 200, 255, 0.4)",
			constellationBordersColor: "#aaa",
			...options.colorConfig,
		};
		this.linesConfig = {
			constellationLinesWidth: 2,
			constellationBordersWidth: 1,
			gridWidth: 0.5,
			...options.linesConfig,
		};

		this.showConstellationsBorders = showConstellationsBorders;
		this.showConstellationsLines = showConstellationsLines;
		this.showStars = showStars;
		this.showGrid = showGrid;

		this.radius = Math.min(this.container.offsetWidth, this.container.offsetHeight) / 2;
		this.center = { x: this.radius, y: this.radius };

		const canvas = document.createElement("canvas");
		canvas.width = this.radius * 2;
		canvas.height = this.radius * 2;
		this.container.appendChild(canvas);

		this.canvas = canvas;
		this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		this.scaleMod = this.radius / 400;

		this.latitude = Angle.fromDegrees(latitude);
		this.longitude = Angle.fromDegrees(longitude);
		this.datetime = AstronomicalTime.fromUTCDate(datetime);
		this.fov = fov;
		this.fovFactor = Math.tan(Angle.fromDegrees(this.fov / 4).radians);

		this.lst = this.datetime.LST(this.longitude);

		this.stars = starsData;
		this.constellationsLines = constellationsLinesData.map((constellation) => ({
			...constellation,
			vertices: constellation.vertices.map((group) => group.map((pair) => pair as [number, number])),
		}));

		this.constellationsBorders = constellationsBordersData.map((constellation) => ({
			...constellation,
			vertices: constellation.vertices.map((group) => group.map((pair) => pair as [number, number])),
		}));

		this.ctx.beginPath();
		this.arcCircle(this.center, this.radius);
		this.ctx.clip();
		this.ctx.closePath();

		this.render();
	}

	private render(): void {
		// this.drawer.clear();
		// this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		// this.drawer.clipCircle();
		this.drawBg();
		if (this.showGrid) this.drawGrid();
		if (this.showConstellationsLines) this.drawConstellationsLines();
		if (this.showConstellationsBorders) this.drawConstellationsBorders();
		if (this.showStars) this.drawStars();

		this.ctx.beginPath();
		this.ctx.shadowBlur = 0;
		const borderWidth = 2;
		this.ctx.lineWidth = borderWidth;
		this.ctx.strokeStyle = this.colorConfig.bgColor;
		this.arcCircle(this.center, this.radius);
		this.ctx.stroke();
		this.ctx.closePath();
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

	setFov(fov: number): this {
		this.fov = fov;
		this.fovFactor = Math.tan(Angle.fromDegrees(this.fov / 4).radians);
		// this.clipCircle();
		this.render();
		return this;
	}

	setShowConstellationsLines(value: boolean): this {
		this.showConstellationsLines = value;
		this.render();
		return this;
	}

	setShowConstellationsBorders(value: boolean): this {
		this.showConstellationsBorders = value;
		this.render();
		return this;
	}

	setShowGrid(value: boolean): this {
		this.showGrid = value;
		this.render();
		return this;
	}

	setShowStars(value: boolean): this {
		this.showStars = value;
		this.render();
		return this;
	}

	private updateLST() {
		this.lst = this.datetime.LST(this.longitude);
	}

	private drawConstellationsLines(): void {
		this.ctx.strokeStyle = this.colorConfig.constellationLinesColor;
		this.ctx.lineWidth = this.linesConfig.constellationLinesWidth * this.scaleMod;
		this.ctx.shadowBlur = 5;
		this.ctx.shadowColor = "rgba(100, 200, 255, 0.8)";

		this.constellationsLines.forEach((constellation) => {
			this.ctx.beginPath();
			for (const group of constellation.vertices) {
				for (let j = 0; j < group.length; j++) {
					const [raDeg, decDeg] = group[j];
					const ra = Angle.fromDegrees(raDeg);
					const dec = Angle.fromDegrees(decDeg);

					const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);

					const coo = this.project(alt, az);

					if (alt.degrees < -20 || j === 0) {
						this.moveTo(coo);
					} else {
						this.lineTo(coo);
					}
				}
			}
			this.ctx.stroke();
		});
	}

	private moveTo(p: Coo) {
		this.ctx.moveTo(p.x, p.y);
	}

	private lineTo(p: Coo) {
		this.ctx.lineTo(p.x, p.y);
	}

	private drawConstellationsBorders(): void {
		this.ctx.strokeStyle = this.colorConfig.constellationBordersColor;
		this.ctx.lineWidth = this.linesConfig.constellationBordersWidth * this.scaleMod;
		this.ctx.shadowBlur = 5;
		this.ctx.shadowColor = "#aaaa";

		this.constellationsBorders.forEach((constellation) => {
			this.ctx.beginPath();
			for (const group of constellation.vertices) {
				for (let j = 0; j < group.length; j++) {
					const [raDeg, decDeg] = group[j];
					const ra = Angle.fromDegrees(raDeg);
					const dec = Angle.fromDegrees(decDeg);

					const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);

					const coo = this.project(alt, az);

					if (alt.degrees < -45) {
						this.moveTo(coo);
					} else {
						this.lineTo(coo);
					}
				}
			}
			this.ctx.stroke();
		});
	}

	private arcCircle(coo: Coo, radius: number): void {
		this.ctx.arc(coo.x, coo.y, radius, 0, Math.PI * 2);
	}

	private drawDisk(coo: Coo, radius: number, color: string | CanvasGradient): void {
		this.ctx.beginPath();
		this.ctx.fillStyle = color;
		this.arcCircle(coo, radius);
		this.ctx.fill();
		this.ctx.closePath();
	}

	private drawBg(): void {
		this.drawDisk({ x: this.radius, y: this.radius }, this.radius * 1.5, this.colorConfig.bgColor);
	}

	private drawStars(): void {
		this.stars.stars.forEach((star) => {
			this.drawStar(star);
		});
	}

	private project(alt: Angle, az: Angle): Coo {
		const scalingFactor = this.radius / this.fovFactor;

		// Calculate position on canvas with FoV scaling
		const r = (scalingFactor * (90 - alt.degrees)) / 90; // Adjust for altitude
		return {
			x: this.center.x + r * az.sin,
			y: this.center.y - r * az.cos,
		};
	}

	private drawGrid() {
		this.ctx.strokeStyle = this.colorConfig.gridColor;
		this.ctx.lineWidth = this.linesConfig.gridWidth * this.scaleMod;
		this.ctx.shadowBlur = 2;
		this.ctx.shadowColor = "rgba(200, 200, 200, 0.2)";

		for (let raDeg = 0; raDeg < 360; raDeg += 15) {
			const ra = Angle.fromDegrees(raDeg);
			this.ctx.beginPath();

			for (let decDeg = raDeg % 90 === 0 ? -90 : -80; decDeg <= (raDeg % 90 === 0 ? 90 : 80); decDeg += 5) {
				const dec = Angle.fromDegrees(decDeg);
				const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);

				if (this.latitude.degrees > -1 && this.latitude.degrees < 1) {
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
			// skips equator if latitude is 90 or -90
			if (decDeg === 0 && (this.latitude.degrees === 90 || this.latitude.degrees === -90)) {
				continue;
			}
			const dec = Angle.fromDegrees(decDeg);
			this.ctx.beginPath();
			let firstPointVisible = false;

			for (let raDeg = 0; raDeg <= 360; raDeg += 5) {
				const ra = Angle.fromDegrees(raDeg);
				const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);

				if (alt.degrees < -3) {
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

	private drawStar(star: Star): void {
		if (star.mag > 5.3) return;
		const starRa = Angle.fromDegrees(star.lon);
		const starDec = Angle.fromDegrees(star.lat);

		const { alt, az } = equatorialToHorizontal(starRa, starDec, this.latitude, this.lst);
		if (alt.degrees < 0) return;

		const coo = this.project(alt, az);

		// star with mag = -1.44 will have size 8
		const size = 10 / 1.2 ** (star.mag + this.stars.mag.max) / this.fovFactor;
		const color = this.colorConfig.starsTemperature ? bvToRGB(star.bv) : this.colorConfig.starColor;

		this.ctx.shadowBlur = 15;
		this.ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
		this.drawDisk(coo, size, color);
	}
}
