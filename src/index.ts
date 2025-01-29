import { Body, Equator, Observer } from "astronomy-engine";
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
import { arcCircle, moveTo, lineTo } from "./helper/canvas";
import projectSphericalTo2D from "./helper/projectSphericalTo2D";

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
	showPlanets?: boolean;
	colorConfig?: Partial<ColorConfig>;
	linesConfig?: Partial<LinesConfig>;
	glow?: boolean;
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
	private observer: Observer;
	private fovFactor: number;
	private lst: Angle;

	private glow: boolean;

	private showConstellationsLines: boolean;
	private showConstellationsBorders: boolean;
	private showStars: boolean;
	private showGrid: boolean;
	private showPlanets: boolean;

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
			showPlanets = true,
			showGrid = true,
			fov = 180,
			glow = false,
		} = options;

		this.container = container;
		this.colorConfig = {
			gridColor: "#555",
			starColor: "#fefefe",
			bgColor: "#000000",
			starsTemperature: false,
			constellationLinesColor: "#eaeaea",
			constellationBordersColor: "#aaa",
			...options.colorConfig,
		};
		this.linesConfig = {
			constellationLinesWidth: 2,
			constellationBordersWidth: 1,
			gridWidth: 1,
			...options.linesConfig,
		};

		this.showConstellationsBorders = showConstellationsBorders;
		this.showConstellationsLines = showConstellationsLines;
		this.showStars = showStars;
		this.showGrid = showGrid;
		this.showPlanets = showPlanets;
		this.glow = glow;

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
		this.fovFactor = this.calculateFovFactor(fov);

		this.lst = this.datetime.LST(this.longitude);
		this.observer = this.getObserver();

		this.stars = starsData;
		this.constellationsLines = constellationsLinesData.map((constellation) => ({
			...constellation,
			vertices: constellation.vertices.map((group) => group.map((pair) => pair as [number, number])),
		}));

		this.constellationsBorders = constellationsBordersData.map((constellation) => ({
			...constellation,
			vertices: constellation.vertices.map((group) => group.map((pair) => pair as [number, number])),
		}));

		this.render();
	}

	private cut() {
		this.ctx.beginPath();
		arcCircle(this.ctx, this.center, this.radius);
		this.ctx.clip();
		this.ctx.closePath();
	}

	private calculateFovFactor(fov: number): number {
		return Math.tan(Angle.fromDegrees(fov / 4).radians);
	}

	private getObserver() {
		return new Observer(this.latitude.degrees, this.longitude.degrees, 0);
	}

	private render(): void {
		// const now = performance.now();
		this.cut();
		this.drawBg();
		if (this.showGrid) this.drawGrid();
		if (this.showConstellationsLines) this.drawConstellationsLines();
		if (this.showConstellationsBorders) this.drawConstellationsBorders();
		if (this.showStars) this.drawStars();
		if (this.showPlanets) this.drawPlanets();
		this.drawMoon();
		this.drawSun();
		this.drawBorder();
		// console.log(performance.now() - now);
	}

	public setLatitude(latitude: number): this {
		this.latitude = Angle.fromDegrees(latitude);
		this.observer = this.getObserver();
		this.render();
		return this;
	}

	public setLongitude(longitude: number): this {
		this.longitude = Angle.fromDegrees(longitude);
		this.observer = this.getObserver();
		this.updateLST();
		this.render();
		return this;
	}

	public setDatetime(datetime: Date): this {
		this.datetime = AstronomicalTime.fromUTCDate(datetime);
		this.updateLST();
		this.render();
		return this;
	}

	public setFov(fov: number): this {
		this.fov = fov;
		this.fovFactor = this.calculateFovFactor(fov);
		this.render();
		return this;
	}

	public setShowConstellationsLines(value: boolean): this {
		this.showConstellationsLines = value;
		this.render();
		return this;
	}

	public setShowConstellationsBorders(value: boolean): this {
		this.showConstellationsBorders = value;
		this.render();
		return this;
	}

	public setShowGrid(value: boolean): this {
		this.showGrid = value;
		this.render();
		return this;
	}

	public setShowStars(value: boolean): this {
		this.showStars = value;
		this.render();
		return this;
	}

	private updateLST() {
		this.lst = this.datetime.LST(this.longitude);
	}

	private drawDisk(coo: Coo, radius: number, color: string | CanvasGradient): void {
		this.ctx.beginPath();
		this.ctx.fillStyle = color;
		arcCircle(this.ctx, coo, radius);
		this.ctx.fill();
		this.ctx.closePath();
	}

	private drawBorder() {
		this.ctx.beginPath();
		this.ctx.shadowBlur = 0;
		this.ctx.lineWidth = 2 * this.scaleMod;
		this.ctx.strokeStyle = this.colorConfig.bgColor;
		arcCircle(this.ctx, this.center, this.radius);
		this.ctx.stroke();
		this.ctx.closePath();
	}

	private drawConstellationsLines(): void {
		this.ctx.strokeStyle = this.colorConfig.constellationLinesColor;
		this.ctx.lineWidth = this.linesConfig.constellationLinesWidth * this.scaleMod;
		if (this.glow) {
			this.ctx.shadowBlur = 5;
			this.ctx.shadowColor = this.colorConfig.constellationLinesColor;
		}

		this.constellationsLines.forEach((constellation) => {
			this.ctx.beginPath();
			for (const group of constellation.vertices) {
				for (let j = 0; j < group.length; j++) {
					const [raDeg, decDeg] = group[j];
					const ra = Angle.fromDegrees(raDeg);
					const dec = Angle.fromDegrees(decDeg);

					const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);

					const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

					if (alt.degrees < -20 || j === 0) {
						moveTo(this.ctx, coo);
					} else {
						lineTo(this.ctx, coo);
					}
				}
			}
			this.ctx.stroke();
		});
	}

	private drawConstellationsBorders(): void {
		this.ctx.strokeStyle = this.colorConfig.constellationBordersColor;
		this.ctx.lineWidth = this.linesConfig.constellationBordersWidth * this.scaleMod;
		if (this.glow) {
			this.ctx.shadowBlur = 5;
			this.ctx.shadowColor = this.colorConfig.constellationBordersColor;
		}

		this.constellationsBorders.forEach((constellation) => {
			this.ctx.beginPath();
			for (const group of constellation.vertices) {
				for (let j = 0; j < group.length; j++) {
					const [raDeg, decDeg] = group[j];
					const ra = Angle.fromDegrees(raDeg);
					const dec = Angle.fromDegrees(decDeg);

					const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);

					const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

					if (alt.degrees < -45) {
						moveTo(this.ctx, coo);
					} else {
						lineTo(this.ctx, coo);
					}
				}
			}
			this.ctx.stroke();
		});
	}

	private drawPlanets(): void {
		const planets = [
			{
				name: Body.Mercury,
				radius: 2,
				color: "#b0b0b0",
			},
			{
				name: Body.Venus,
				radius: 5,
				color: "#ffffe0",
			},
			{
				name: Body.Mars,
				radius: 3,
				color: "#ff4500",
			},
			{
				name: Body.Jupiter,
				radius: 6,
				color: "#e3a869",
			},
			{
				name: Body.Saturn,
				radius: 5.5,
				color: "#ffcc99",
			},
			{
				name: Body.Uranus,
				radius: 1.5,
				color: "#66ccff",
			},
			{
				name: Body.Neptune,
				radius: 1,
				color: "#3366cc",
			},
		];
		for (const planet of planets) {
			const equatorial = Equator(planet.name, this.datetime.UTCDate, this.observer, true, true);

			const ra = Angle.fromHours(equatorial.ra);
			const dec = Angle.fromDegrees(equatorial.dec);

			const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);

			const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

			if (this.glow) {
				this.ctx.shadowBlur = 10;
				this.ctx.shadowColor = planet.color;
			}

			this.drawDisk(coo, (planet.radius * this.scaleMod) / this.fovFactor, planet.color);
		}
	}

	private drawMoon(): void {
		const equatorial = Equator(Body.Moon, this.datetime.UTCDate, this.observer, true, true);

		const ra = Angle.fromHours(equatorial.ra);
		const dec = Angle.fromDegrees(equatorial.dec);

		const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);

		const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

		const color = "#fff";
		if (this.glow) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = color;
		}
		this.drawDisk(coo, (8 * this.scaleMod) / this.fovFactor, color);
	}

	private drawSun(): void {
		const equatorial = Equator(Body.Sun, this.datetime.UTCDate, this.observer, true, true);

		const ra = Angle.fromHours(equatorial.ra);
		const dec = Angle.fromDegrees(equatorial.dec);

		const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);

		const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

		const color = "#ffe484";
		if (this.glow) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = color;
		}
		this.drawDisk(coo, (12 * this.scaleMod) / this.fovFactor, color);
	}

	private drawBg(): void {
		this.drawDisk({ x: this.radius, y: this.radius }, this.radius * 1.5, this.colorConfig.bgColor);
	}

	private drawStars(): void {
		this.stars.stars.forEach((star) => {
			this.drawStar(star);
		});
	}

	private drawGrid() {
		this.ctx.strokeStyle = this.colorConfig.gridColor;
		this.ctx.lineWidth = this.linesConfig.gridWidth * this.scaleMod;

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

				const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);
				lineTo(this.ctx, coo);
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

				const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);
				if (!firstPointVisible) {
					moveTo(this.ctx, coo);
					firstPointVisible = true;
				} else {
					lineTo(this.ctx, coo);
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

		const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

		// star with mag = -1.44 will have size 8
		const size = ((8 / 1.18 ** (star.mag + this.stars.mag.max)) * this.scaleMod) / this.fovFactor;
		const color = this.colorConfig.starsTemperature ? bvToRGB(star.bv) : this.colorConfig.starColor;

		if (this.glow) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = color;
		}
		this.drawDisk(coo, size, color);
	}
}
