import { Body, Equator, Observer } from "astronomy-engine";
import constellationsBoundariesData from "../data/constellations.boundaries.json";
import constellationsLinesData from "../data/constellations.lines.json";
import constellationsLabelsData from "../data/constellations.labels.json";
import planets from "../data/planets.json";
import starsData from "../data/stars.6.json";
import Angle from "./Angle/Angle";
import AstronomicalTime from "./AstronomicalTime/AstronomicalTime";
import { type Config, defaultConfig } from "./config";
import type DeepPartial from "./helper/DeepPartial";
import { arcCircle, lineTo, moveTo } from "./helper/canvas";
import { bvToRGB } from "./helper/color";
import equatorialToHorizontal from "./helper/equatorialToHorizontal";
import projectSphericalTo2D from "./helper/projectSphericalTo2D";
import type ConstellationBoundary from "./types/ConstellationBoundary.type";
import type ConstellationLine from "./types/ConstellationLine.type";
import type Coo from "./types/Coo.type";
import type Planet from "./types/Planet.type";
import type StarsData from "./types/StarsData.type";
import type ConstellationLabel from "./types/ConstellationLabel.type";

type Options = {
	latitude: number;
	longitude: number;
	datetime: Date;
	fov: number;
};

const defaultOptions = {
	latitude: 0,
	longitude: 0,
	datetime: new Date(),
	fov: 180,
};

const monochromeLabelColor = "#fefefe";

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
	private observer: Observer;
	private fovFactor: number;
	private lst: Angle;

	private config: Config;

	private stars: StarsData;
	private planets: Planet[];
	private constellationsLines: ConstellationLine[];
	private constellationsBoundaries: ConstellationBoundary[];
	private constellationsLabels: Map<string, ConstellationLabel>;

	constructor(
		container: HTMLDivElement,
		options: Partial<Options> = defaultOptions,
		config: DeepPartial<Config> = defaultConfig,
	) {
		this.container = container;
		this.config = {
			...defaultConfig,
			stars: {
				...defaultConfig.stars,
				...config.stars,
			},
			grid: {
				...defaultConfig.grid,
				...config.grid,
			},
			constellations: {
				boundaries: {
					...defaultConfig.constellations.boundaries,
					...config.constellations?.boundaries,
				},
				lines: {
					...defaultConfig.constellations.lines,
					...config.constellations?.lines,
				},
				labels:
					config.constellations?.labels !== undefined
						? config.constellations?.labels
						: defaultConfig.constellations.labels,
			},
			planets: {
				...defaultConfig.planets,
				...config.planets,
			},
			sun: {
				...defaultConfig.sun,
				...config.sun,
			},
			moon: {
				...defaultConfig.moon,
				...config.moon,
			},
			bgColor: config.bgColor !== undefined ? config.bgColor : defaultConfig.bgColor,
			glow: config.glow !== undefined ? config.glow : defaultConfig.glow,
			monochrome: config.monochrome !== undefined ? config.monochrome : defaultConfig.monochrome,
		};
		const opts = { ...defaultOptions, ...options };

		this.radius = Math.min(this.container.offsetWidth, this.container.offsetHeight) / 2;
		this.center = { x: this.radius, y: this.radius };

		const canvas = document.createElement("canvas");
		canvas.width = this.radius * 2;
		canvas.height = this.radius * 2;
		this.container.appendChild(canvas);
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		this.scaleMod = this.radius / 400;

		this.latitude = Angle.fromDegrees(opts.latitude);
		this.longitude = Angle.fromDegrees(opts.longitude);
		this.datetime = AstronomicalTime.fromUTCDate(opts.datetime);
		this.fovFactor = this.calculateFovFactor(opts.fov);

		this.lst = this.datetime.LST(this.longitude);
		this.observer = this.getObserver();

		this.stars = starsData;
		this.planets = planets;
		this.constellationsLines = constellationsLinesData.map((constellation) => ({
			...constellation,
			vertices: constellation.vertices.map((group) => group.map((pair) => pair as [number, number])),
		}));

		this.constellationsBoundaries = constellationsBoundariesData.map((constellation) => ({
			...constellation,
			vertices: constellation.vertices.map((group) => group.map((pair) => pair as [number, number])),
		}));
		this.constellationsLabels = new Map();

		for (const [key, value] of Object.entries(constellationsLabelsData)) {
			this.constellationsLabels.set(key, { ...value, coords: [value.coords[0], value.coords[1]] });
		}

		this.render();
	}
	private cut() {
		this.ctx.beginPath();
		arcCircle(this.ctx, this.center, this.radius);
		this.ctx.clip();
		// this.ctx.closePath();
	}

	private calculateFovFactor(fov: number): number {
		return Math.tan(Angle.fromDegrees(fov / 4).radians);
	}

	private getObserver(): Observer {
		return new Observer(this.latitude.degrees, this.longitude.degrees, 0);
	}

	private render(): void {
		// const now = performance.now();
		this.cut();
		this.drawBg();

		if (this.config.grid.enabled) this.drawGrid();
		if (this.config.constellations.lines.enabled) this.drawConstellationsLines();
		if (this.config.constellations.boundaries.enabled) this.drawConstellationsBoundaries();
		if (this.config.stars.enabled) this.drawStars();
		if (this.config.planets.enabled) this.drawPlanets();
		if (this.config.sun.enabled) this.drawSun();
		if (this.config.moon.enabled) this.drawMoon();

		this.drawBorder();
		// console.log(performance.now() - now);
	}

	private lerp(start: number, end: number, t: number): number {
		return start + (end - start) * t;
	}

	private easeProgress(progress: number): number {
		return progress < 0.5 ? 2 * progress ** 2 : 1 - (-2 * progress + 2) ** 2 / 2;
	}

	private animationFrameId: number | null = null;

	private animate<T>(
		startValue: T,
		targetValue: T,
		duration: number,
		callback: (value: T) => void,
		update: (value: T) => void,
		lerp: (start: T, end: T, progress: number) => T,
	): this {
		// Cancel the previous animation if it exists
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
		}

		const startTime = performance.now();

		const step = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1); // Normalize to [0,1]
			const easedProgress = this.easeProgress(progress);
			const newValue = lerp(startValue, targetValue, easedProgress);

			// Update the value and render
			update(newValue);
			callback(newValue);

			// Continue animation if not finished
			if (progress < 1) {
				this.animationFrameId = requestAnimationFrame(step);
			} else {
				this.animationFrameId = null; // Clear the animation frame ID when finished
			}
		};

		this.animationFrameId = requestAnimationFrame(step);
		return this;
	}

	public animateLocation(
		latitude: number,
		longitude: number,
		duration: number,
		callback: (latitude: number, longitude: number) => void,
	): this {
		const startLat = this.latitude.degrees;
		const startLon = this.longitude.degrees;

		return this.animate<[number, number]>(
			[startLat, startLon],
			[latitude, longitude],
			duration,
			([newLat, newLon]) => {
				this.latitude = Angle.fromDegrees(newLat);
				this.longitude = Angle.fromDegrees(newLon);
				this.observer = this.getObserver();
				this.updateLST();
				this.render();
				callback(newLat, newLon);
			},
			([newLat, newLon]) => {
				this.latitude = Angle.fromDegrees(newLat);
				this.longitude = Angle.fromDegrees(newLon);
			},
			(start, end, progress) => [this.lerp(start[0], end[0], progress), this.lerp(start[1], end[1], progress)],
		);
	}

	public animateDate(date: Date, duration: number, callback: (date: Date) => void): this {
		const startTime = this.datetime.UTCDate.getTime();
		const targetTime = date.getTime();

		return this.animate<number>(
			startTime,
			targetTime,
			duration,
			(newTime) => {
				this.datetime = AstronomicalTime.fromUTCDate(new Date(newTime));
				this.updateLST();
				this.render();
				callback(new Date(newTime));
			},
			(newTime) => {
				this.datetime = AstronomicalTime.fromUTCDate(new Date(newTime));
			},
			(start, end, progress) => this.lerp(start, end, progress),
		);
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
		this.fovFactor = this.calculateFovFactor(fov);
		this.render();
		return this;
	}

	public setShowConstellationsLines(value: boolean): this {
		this.config.constellations.lines.enabled = value;
		this.render();
		return this;
	}

	public setShowConstellationsBoundaries(value: boolean): this {
		this.config.constellations.boundaries.enabled = value;
		this.render();
		return this;
	}

	public setShowGrid(value: boolean): this {
		this.config.grid.enabled = value;
		this.render();
		return this;
	}

	public setShowStars(value: boolean): this {
		this.config.stars.enabled = value;
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
		this.ctx.strokeStyle = this.config.bgColor;
		arcCircle(this.ctx, this.center, this.radius);
		this.ctx.stroke();
	}

	private drawConstellationsLines(): void {
		this.ctx.strokeStyle = this.config.constellations.lines.color;
		this.ctx.lineWidth = this.config.constellations.lines.width * this.scaleMod;
		if (this.config.glow) {
			this.ctx.shadowBlur = 5;
			this.ctx.shadowColor = this.config.constellations.lines.color;
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

			if (this.config.constellations.labels) {
				const font = "Arial";
				const fontSize = 10 * this.scaleMod;
				this.ctx.font = `${fontSize}px ${font}`;

				const constellationsLabel = this.constellationsLabels.get(constellation.id);
				if (!constellationsLabel) throw new Error("contellation label not found");
				const text = constellationsLabel.labels.la;
				const textWidth = this.ctx.measureText(text).width;

				const [raDeg, decDeg] = constellationsLabel.coords;
				const ra = Angle.fromDegrees(raDeg);
				const dec = Angle.fromDegrees(decDeg);

				const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);
				const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

				this.ctx.fillStyle = "#fefefe";
				this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - fontSize / 2);
			}
			this.ctx.stroke();
		});
	}

	private drawConstellationsBoundaries(): void {
		this.ctx.strokeStyle = this.config.constellations.boundaries.color;
		this.ctx.lineWidth = this.config.constellations.boundaries.width * this.scaleMod;
		if (this.config.glow) {
			this.ctx.shadowBlur = 5;
			this.ctx.shadowColor = this.config.constellations.boundaries.color;
		}

		this.constellationsBoundaries.forEach((constellation) => {
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
		const font = "Arial";
		const fontSize = 12 * this.scaleMod;
		this.ctx.font = `${fontSize}px ${font}`;

		for (const planet of this.planets) {
			const body = Body[planet.name as keyof typeof Body];
			const equatorial = Equator(body, this.datetime.UTCDate, this.observer, true, true);

			const ra = Angle.fromHours(equatorial.ra);
			const dec = Angle.fromDegrees(equatorial.dec);

			const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);
			const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

			const color = this.config.monochrome ? monochromeLabelColor : planet.color;

			if (this.config.glow) {
				this.ctx.shadowBlur = 10;
				this.ctx.shadowColor = color;
			}

			const rad = (planet.radius * this.scaleMod) / this.fovFactor;
			const textWidth = this.ctx.measureText(planet.name).width;

			this.drawDisk(coo, rad, color);
			if (this.config.planets.labels) {
				this.ctx.fillText(planet.name, coo.x - textWidth / 2, coo.y - rad * 1.5);
			}
		}
	}

	private drawMoon(): void {
		const font = "Arial";
		const fontSize = 15 * this.scaleMod;
		this.ctx.font = `${fontSize}px ${font}`;

		const equatorial = Equator(Body.Moon, this.datetime.UTCDate, this.observer, true, true);

		const ra = Angle.fromHours(equatorial.ra);
		const dec = Angle.fromDegrees(equatorial.dec);

		const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);
		const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

		const color = this.config.monochrome ? monochromeLabelColor : "#fff";
		if (this.config.glow) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = color;
		}

		const rad = (4 * this.scaleMod) / this.fovFactor;

		const text = "Moon";
		const textWidth = this.ctx.measureText(text).width;

		this.drawDisk(coo, rad, color);
		if (this.config.planets.labels) {
			this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - rad * 1.5);
		}
	}

	private drawSun(): void {
		const font = "Arial";
		const fontSize = 15 * this.scaleMod;
		this.ctx.font = `${fontSize}px ${font}`;

		const equatorial = Equator(Body.Sun, this.datetime.UTCDate, this.observer, true, true);

		const ra = Angle.fromHours(equatorial.ra);
		const dec = Angle.fromDegrees(equatorial.dec);

		const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);
		const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

		// todo: move out
		const color = this.config.monochrome ? monochromeLabelColor : "#ffe484";
		if (this.config.glow) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = color;
		}

		const rad = (8 * this.scaleMod) / this.fovFactor;

		const text = "Sun";
		const textWidth = this.ctx.measureText(text).width;

		this.drawDisk(coo, rad, color);
		if (this.config.planets.labels) {
			this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - rad * 1.5);
		}
	}

	private drawBg(): void {
		this.ctx.fillStyle = this.config.bgColor;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		// this.drawDisk({ x: this.radius, y: this.radius }, this.radius * 1.5, this.config.bgColor);
	}

	private drawStars(): void {
		this.stars.stars.forEach((star) => {
			// if (star.mag > 5.2) return;
			const starRa = Angle.fromDegrees(star.lon);
			const starDec = Angle.fromDegrees(star.lat);

			const { alt, az } = equatorialToHorizontal(starRa, starDec, this.latitude, this.lst);
			if (alt.degrees < 0) return;

			const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

			// star with mag = -1.44 will have size 8
			const size = ((8 / 1.18 ** (star.mag + this.stars.mag.max)) * this.scaleMod) / this.fovFactor;
			const color = this.config.monochrome ? this.config.stars.color : bvToRGB(star.bv);

			if (this.config.glow) {
				this.ctx.shadowBlur = 10;
				this.ctx.shadowColor = color;
			}

			this.drawDisk(coo, size, color);
		});
	}

	private drawGrid() {
		if (!this.config.grid.enabled) return;
		this.ctx.strokeStyle = this.config.grid.color;
		this.ctx.lineWidth = this.config.grid.width * this.scaleMod;

		for (let raDeg = 0; raDeg < 360; raDeg += 15) {
			this.ctx.beginPath();
			const ra = Angle.fromDegrees(raDeg);

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

		this.ctx.beginPath();
		for (let decDeg = -80; decDeg <= 80; decDeg += 20) {
			// skips equator if latitude is 90 or -90
			if (decDeg === 0 && (this.latitude.degrees === 90 || this.latitude.degrees === -90)) {
				continue;
			}
			const dec = Angle.fromDegrees(decDeg);
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
		}
		this.ctx.stroke();
	}
}
