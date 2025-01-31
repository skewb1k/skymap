import { Body, Equator, Observer } from "astronomy-engine";
import constellationsBoundariesData from "../data/constellations.boundaries.json";
import constellationsLabelsData from "../data/constellations.labels.json";
import constellationsLinesData from "../data/constellations.lines.json";
import moonLabelsData from "../data/moon.labels.json";
import planetsLabelsData from "../data/planets.labels.json";
import starsData from "../data/stars.6.json";
import sunLabelsData from "../data/sun.labels.json";
import Angle from "./Angle/Angle";
import AstronomicalTime from "./AstronomicalTime/AstronomicalTime";
import { type Config, defaultConfig, mergeConfigs } from "./config";
import type DeepPartial from "./helpers/DeepPartial";
import { arcCircle, lineTo, moveTo } from "./helpers/canvas";
import { bvToRGB } from "./helpers/color";
import equatorialToHorizontal from "./helpers/equatorialToHorizontal";
import projectSphericalTo2D from "./helpers/projectSphericalTo2D";
import type ConstellationBoundary from "./types/ConstellationBoundary.type";
import type ConstellationLabel from "./types/ConstellationLabel.type";
import type ConstellationLine from "./types/ConstellationLine.type";
import type Coo from "./types/Coo.type";
import type Labels from "./types/Labels.type";
import type PlanetsLabels from "./types/PlanetLabels.type";
import type StarsData from "./types/StarsData.type";

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

const planets = [
	{
		id: "mer",
		body: Body.Mercury,
		// radius: 3,
		radius: 1,
		color: "#b0b0b0",
	},
	{
		id: "ven",
		body: Body.Venus,
		// radius: 7.5,
		radius: 1,
		color: "#ffffe0",
	},
	{
		id: "mar",
		body: Body.Mars,
		// radius: 4,
		radius: 1,
		color: "#ff4500",
	},
	{
		id: "jup",
		body: Body.Jupiter,
		// radius: 88,
		radius: 4,
		color: "#e3a869",
	},
	{
		id: "sat",
		body: Body.Saturn,
		// radius: 32,
		radius: 3.5,
		color: "#66ccff",
	},
	{
		id: "nep",
		body: Body.Neptune,
		// radius: 30,
		radius: 2.2,
		color: "#3366cc",
	},
];

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

	public config: Config;
	public configLoaded: boolean;

	private stars: StarsData;
	private planetLabels: PlanetsLabels;
	private moonLabels: Labels;
	private sunLabels: Labels;
	private constellationsLines: ConstellationLine[];
	private constellationsBoundaries: ConstellationBoundary[];
	private constellationsLabels: Map<string, ConstellationLabel>;

	constructor(
		container: HTMLDivElement,
		options: Partial<Options> = defaultOptions,
		config: DeepPartial<Config> = this.createReactiveConfig(defaultConfig),
	) {
		this.container = container;

		const canvas = document.createElement("canvas");
		canvas.style = `
			width: 100%;
			height: 100%;
			display: block;
		`;

		this.radius = Math.min(this.container.offsetWidth, this.container.offsetHeight) / 2;
		this.center = { x: this.radius, y: this.radius };
		this.scaleMod = this.radius / 400;

		canvas.width = this.radius * 2;
		canvas.height = this.radius * 2;

		const resizeObserver = new ResizeObserver(() => {
			const dpr = window.devicePixelRatio || 1;

			// Get actual size of the div
			const width = container.clientWidth;
			const height = container.clientHeight;

			// Set canvas size to match container, but with high resolution
			canvas.width = width * dpr;
			canvas.height = height * dpr;

			this.radius = Math.min(width, height) / 2;
			this.center = { x: this.radius, y: this.radius };
			this.scaleMod = this.radius / 400;

			// Scale context to avoid blurry graphics
			this.ctx.scale(dpr, dpr);
			this.render();
		});

		resizeObserver.observe(container);

		this.canvas = canvas;
		this.container.appendChild(canvas);
		this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		const opts = { ...defaultOptions, ...options };

		this.latitude = Angle.fromDegrees(opts.latitude);
		this.longitude = Angle.fromDegrees(opts.longitude);
		this.datetime = AstronomicalTime.fromUTCDate(opts.datetime);
		this.fovFactor = this.calculateFovFactor(opts.fov);

		this.lst = this.datetime.LST(this.longitude);
		this.observer = this.getObserver();

		this.stars = starsData;
		this.planetLabels = planetsLabelsData;
		this.moonLabels = moonLabelsData;
		this.sunLabels = sunLabelsData;
		this.constellationsLines = constellationsLinesData;
		this.constellationsBoundaries = constellationsBoundariesData;

		this.constellationsLabels = new Map();
		for (const [key, value] of Object.entries(constellationsLabelsData)) {
			this.constellationsLabels.set(key, value);
		}

		this.configLoaded = false;
		this.config = this.createReactiveConfig(mergeConfigs(defaultConfig, config));
		this.configLoaded = true;
	}

	// private createReactiveConfig(config: Config): Config {
	// 	return new Proxy<Config>(config, {
	// 		set: (target: Config, prop: any, value: any): boolean => {
	// 			(target as any)[prop] = value;
	// 			this.render();
	// 			return true;
	// 		},
	// 	});
	// }

	private createReactiveConfig(config: Config): Config {
		// Recursive Proxy handler
		const handler = {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			set: (target: any, prop: string | symbol, value: any): boolean => {
				target[prop] = value;
				if (this.configLoaded) {
					this.render();
				}
				return true;
			},
		};

		const proxyConfig = new Proxy(config, handler);

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const deepProxy = (obj: any) => {
			if (obj && typeof obj === "object") {
				for (const key of Object.keys(obj)) {
					if (typeof obj[key] === "object") {
						obj[key] = new Proxy(obj[key], handler);
						deepProxy(obj[key]);
					}
				}
			}
		};

		deepProxy(proxyConfig);
		return proxyConfig;
	}

	private cut() {
		this.ctx.beginPath();
		arcCircle(this.ctx, this.center, this.radius);
		this.ctx.clip();
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

		for (const constellation of this.constellationsLines) {
			this.ctx.beginPath();
			for (const group of constellation.coo) {
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

			if (this.config.constellations.lines.labels.enabled) {
				const fontSize = 10 * this.scaleMod * this.config.constellations.lines.labels.size;
				this.ctx.font = `${fontSize}px ${this.config.fontFamily}`;

				const constellationsLabel = this.constellationsLabels.get(constellation.id);
				if (!constellationsLabel) throw new Error("contellation label not found");

				const text = constellationsLabel.labels[this.config.language];
				if (text) {
					const textWidth = this.ctx.measureText(text).width;
					const [raDeg, decDeg] = constellationsLabel.coo;
					const ra = Angle.fromDegrees(raDeg);
					const dec = Angle.fromDegrees(decDeg);

					const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);
					const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

					this.ctx.fillStyle = this.config.constellations.lines.labels.color;
					this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - fontSize / 2);
				}
			}
			this.ctx.stroke();
		}
	}

	private drawConstellationsBoundaries(): void {
		this.ctx.strokeStyle = this.config.constellations.boundaries.color;
		this.ctx.lineWidth = this.config.constellations.boundaries.width * this.scaleMod;
		if (this.config.glow) {
			this.ctx.shadowBlur = 5;
			this.ctx.shadowColor = this.config.constellations.boundaries.color;
		}

		for (const constellation of this.constellationsBoundaries) {
			this.ctx.beginPath();
			for (const group of constellation.coo) {
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
		}
	}

	private drawPlanets(): void {
		const fontSize = 12 * this.scaleMod * this.config.planets.labels.size;
		this.ctx.font = `${fontSize}px ${this.config.fontFamily}`;

		for (const planet of planets) {
			const equatorial = Equator(planet.body, this.datetime.UTCDate, this.observer, true, true);

			const ra = Angle.fromHours(equatorial.ra);
			const dec = Angle.fromDegrees(equatorial.dec);

			const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);
			const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

			const color = this.config.planets.color !== undefined ? this.config.planets.color : planet.color;
			if (this.config.glow) {
				this.ctx.shadowBlur = 10;
				this.ctx.shadowColor = color;
			}

			const radius = (planet.radius * this.scaleMod * this.config.planets.size) / this.fovFactor;
			this.drawDisk(coo, radius, color);

			if (this.config.planets.labels.enabled) {
				const text = this.planetLabels[planet.id][this.config.language];
				if (text) {
					const textWidth = this.ctx.measureText(text).width;
					this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - radius - fontSize / 2);
				}
			}
		}
	}

	private drawMoon(): void {
		const size = 5;
		const fontSize = size * 2 * this.scaleMod * this.config.moon.label.size;
		this.ctx.font = `${fontSize}px ${this.config.fontFamily}`;

		const equatorial = Equator(Body.Moon, this.datetime.UTCDate, this.observer, true, true);

		const ra = Angle.fromHours(equatorial.ra);
		const dec = Angle.fromDegrees(equatorial.dec);

		const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);
		const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

		const color = this.config.moon.color;
		if (this.config.glow) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = color;
		}

		const rad = (4 * this.scaleMod) / this.fovFactor;

		this.drawDisk(coo, rad, color);
		if (this.config.planets.labels.enabled) {
			const text = this.moonLabels[this.config.language];
			if (text) {
				const textWidth = this.ctx.measureText(text).width;
				this.ctx.fillStyle = this.config.moon.label.color;
				this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - rad * 1.5);
			}
		}
	}

	private drawSun(): void {
		const size = 8;
		const fontSize = size * 2 * this.scaleMod * this.config.sun.label.size;
		this.ctx.font = `${fontSize}px ${this.config.fontFamily}`;

		const equatorial = Equator(Body.Sun, this.datetime.UTCDate, this.observer, true, true);

		const ra = Angle.fromHours(equatorial.ra);
		const dec = Angle.fromDegrees(equatorial.dec);

		const { alt, az } = equatorialToHorizontal(ra, dec, this.latitude, this.lst);
		const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

		const color = this.config.sun.color;
		if (this.config.glow) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = color;
		}

		const rad = (size * this.scaleMod) / this.fovFactor;

		this.drawDisk(coo, rad, color);
		if (this.config.planets.labels.enabled) {
			const text = this.sunLabels[this.config.language];
			if (text) {
				const textWidth = this.ctx.measureText(text).width;
				this.ctx.fillStyle = this.config.sun.label.color;
				this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - rad * 1.5);
			}
		}
	}

	private drawBg(): void {
		this.ctx.fillStyle = this.config.bgColor;
		this.ctx.fillRect(0, 0, this.radius * 2, this.radius * 2);
	}

	private drawStars(): void {
		for (const star of this.stars.stars) {
			// if (star.mag > 5.2) return;
			const starRa = Angle.fromDegrees(star.lon);
			const starDec = Angle.fromDegrees(star.lat);

			const { alt, az } = equatorialToHorizontal(starRa, starDec, this.latitude, this.lst);
			if (alt.degrees < 0) continue;

			const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

			// star with mag = -1.44 will have size 8
			const size = ((8 / 1.18 ** (star.mag + this.stars.mag.max)) * this.scaleMod) / this.fovFactor;
			const color = this.config.stars.color !== undefined ? this.config.stars.color : bvToRGB(star.bv);

			if (this.config.glow) {
				this.ctx.shadowBlur = 10;
				this.ctx.shadowColor = color;
			}

			this.drawDisk(coo, size, color);
		}
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
