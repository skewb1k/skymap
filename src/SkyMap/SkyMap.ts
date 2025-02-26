import { Body, Equator, Observer } from "astronomy-engine";
import { init } from "browser-geo-tz";
import cloneDeep from "lodash.clonedeep";
import Angle from "../Angle/Angle";
import { degToRad, hoursToRad, radToDeg } from "../Angle/angleconv";
import AstronomicalTime from "../AstronomicalTime/AstronomicalTime";
import { type Config, defaultConfig, mergeConfigs } from "../config";
import type DeepPartial from "../helpers/DeepPartial";
import { arcCircle, lineTo, moveTo } from "../helpers/canvas";
import { bvToRGB } from "../helpers/color";
import deepProxy from "../helpers/deepProxy";
import easeProgress from "../helpers/easeProgress";
import fetchJson from "../helpers/fetchJson";
import getFovFactor from "../helpers/getFovFactor";
import lerpAngle from "../helpers/lerp";
import projectSphericalTo2D from "../helpers/projectSphericalTo2D";
import {
	type ObserverParams,
	defaultObserverParams,
	validateFov,
	validateLatitude,
	validateLongitude,
	validateObserverParams,
} from "../observerParams";
import { planets } from "../planets";
import type ConstellationBoundary from "../types/ConstellationBoundary.type";
import type ConstellationLabel from "../types/ConstellationLabel.type";
import type ConstellationLine from "../types/ConstellationLine.type";
import type Coo from "../types/Coo.type";
import type Labels from "../types/Labels.type";
import type PlanetsLabels from "../types/PlanetLabels.type";
import type StarsData from "../types/StarsData.type";

type AngleWithSinAndCos = Angle & {
	cos: number;
	sin: number;
};

/**
 * SkyMap renders an interactive sky map on a canvas element.
 *
 * It calculates positions of stars, planets, the Moon, the Sun, and
 * constellation features using astronomical formulas and renders them
 * based on a configurable visual style.
 *
 * @param container - The target div element where the canvas will be appended.
 * @param observerParams - Observer parameters for location and time.
 *   - `latitude`: The new latitude in degrees.
 *   - `longitude`: The new longitude in degrees.
 *   - `date`: The new date/time for astronomical calculations.
 *   - `fov`: The new field of view in degrees.
 * @param config - Configuration to customize colors, sizes, language, etc. Uses defaults for missing fields.
 */
export class SkyMap {
	private container: HTMLDivElement;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	private geoTz: {
		find: (lat: number, lon: number) => Promise<string[]>;
	};

	/** Reactive configuration object for styling and display options. */
	public cfg: Config;

	private observerParams: ObserverParams;

	/** A modifier based on canvas radius to scale drawing dimensions. */
	private scaleMod: number;

	private radius: number;
	private center: Coo;
	private latitude: AngleWithSinAndCos;
	private longitude: Angle;
	private date: AstronomicalTime;
	private observer: Observer;
	private fovFactor: number;
	private lst: Angle;

	// Data for drawing various objects on the sky map.
	private stars: StarsData | undefined;
	private planetLabels: PlanetsLabels | undefined;
	private moonLabels: Labels | undefined;
	private sunLabels: Labels | undefined;
	private constellationsLines: ConstellationLine[] | undefined;
	private constellationsBoundaries: ConstellationBoundary[] | undefined;
	private constellationsLabels: Map<string, ConstellationLabel> | undefined;

	/**
	 * Handler invoked whenever the configuration is updated.
	 * Triggers a re-render of the sky map.
	 */
	private configUpdatedHandler = () => {
		this.render();
	};

	private resizeObserver: ResizeObserver;

	private resizeHandler = () => {
		const width = this.container.clientWidth;

		this.resize(width);
	};

	public constructor(
		container: HTMLDivElement,
		observerParams: Partial<ObserverParams> = defaultObserverParams,
		config: DeepPartial<Config> = deepProxy(defaultConfig, this.configUpdatedHandler),
	) {
		this.container = document.createElement("div");
		this.container.style.clipPath = "circle(50%)";
		this.container.style.aspectRatio = "1/1";
		container.innerHTML = "";
		container.append(this.container);

		this.geoTz = init();

		this.observerParams = { ...defaultObserverParams, ...observerParams };
		this.cfg = deepProxy(mergeConfigs(defaultConfig, config), this.configUpdatedHandler);
		if (!validateObserverParams(this.observerParams)) {
			throw new Error("Invalid observer parameters.");
		}

		const canvas = document.createElement("canvas");
		canvas.style.width = "100%";
		canvas.style.height = "100%";
		canvas.style.display = "block";

		this.canvas = canvas;
		this.container.appendChild(canvas);
		this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		this.latitude = this.calculateAngleWithSinAndCos(this.observerParams.latitude);

		this.longitude = Angle.fromDegrees(this.observerParams.longitude);
		this.date = AstronomicalTime.fromUTCDate(this.observerParams.date);
		this.fovFactor = getFovFactor(this.observerParams.fov);

		this.lst = Angle.fromDegrees(this.date.LST(this.longitude.deg));
		this.observer = this.getObserver();

		this.radius = 0;
		this.center = { x: 0, y: 0 };
		this.scaleMod = 0;

		Promise.all([
			fetchJson<StarsData>(this.cfg.stars.data),
			fetchJson<ConstellationBoundary[]>(this.cfg.constellations.boundaries.data),
			fetchJson<ConstellationLine[]>(this.cfg.constellations.lines.data),
			fetchJson<(ConstellationLabel & { id: string })[]>(this.cfg.constellations.lines.labels.data),
			fetchJson<PlanetsLabels>(this.cfg.planets.labels.data),
			fetchJson<Labels>(this.cfg.moon.label.data),
			fetchJson<Labels>(this.cfg.sun.label.data),
		]).then(
			([
				stars,
				constellationsBoundaries,
				constellationsLines,
				constellationsLabelsRaw,
				planetLabels,
				moonLabels,
				sunLabels,
			]) => {
				const constellationsLabels = new Map<string, ConstellationLabel>();
				for (const label of constellationsLabelsRaw) {
					constellationsLabels.set(label.id, { coo: label.coo, labels: label.labels });
				}

				this.stars = stars;
				this.constellationsBoundaries = constellationsBoundaries;
				this.constellationsLines = constellationsLines;
				this.constellationsLabels = constellationsLabels;
				this.planetLabels = planetLabels;
				this.moonLabels = moonLabels;
				this.sunLabels = sunLabels;
				this.setDate(this.observerParams.date);
			},
		);

		this.resizeObserver = new ResizeObserver(this.resizeHandler);
		this.resizeObserver.observe(this.container);
	}

	/**
	 * Disconnects SkyMap from container.
	 */
	public disconnect() {
		this.resizeObserver.disconnect();
		this.lastGeoTzFindCallId = 0;
	}

	/**
	 * Clones this SkyMap instance, creating a new instance with the same configuration for another container.
	 *
	 * @param container - The target div element where the skymap will be appended.
	 * @returns The SkyMap instance.
	 */
	public clone(container: HTMLDivElement): SkyMap {
		return new SkyMap(container, cloneDeep(this.observerParams), cloneDeep(this.cfg));
	}

	private calculateAngleWithSinAndCos(deg: number): AngleWithSinAndCos {
		const angle = Angle.fromDegrees(deg);
		return { ...angle, cos: Math.cos(angle.ra), sin: Math.sin(angle.ra) };
	}

	/**
	 * Resizes the canvas while maintaining proper device pixel ratio (DPR) scaling.
	 *
	 * @param size - The size in pixels for both width and height to create a square canvas.
	 * @returns The SkyMap instance.
	 */
	public resize(size: number): this {
		const dpr = window.devicePixelRatio || 1;
		this.canvas.width = size * dpr;
		this.canvas.height = size * dpr;
		this.radius = size / 2;
		this.center = { x: this.radius, y: this.radius };
		this.scaleMod = this.radius / 400;
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		this.render();
		return this;
	}

	/**
	 * Updates both the observer's latitude and longitude.
	 *
	 * @param latitude - The new latitude in degrees.
	 * @param longitude - The new longitude in degrees.
	 * @returns The SkyMap instance.
	 */
	public setLocation(latitude: number, longitude: number): this {
		if (!validateLatitude(latitude) || !validateLongitude(longitude)) {
			throw new Error("Invalid latitude or longitude value");
		}

		this.updateLongitude(longitude);
		this.updateLatitude(latitude);
		this.updateDate().then((ok) => {
			if (ok) this.render();
		});
		return this;
	}

	/**
	 * Updates the observer's latitude.
	 *
	 * @param latitude - The new latitude in degrees.
	 * @returns The SkyMap instance for chaining.
	 */
	public setLatitude(latitude: number): this {
		if (!validateLatitude(latitude)) {
			throw new Error("Invalid latitude value");
		}

		this.updateLatitude(latitude);
		this.updateDate().then((ok) => {
			if (ok) this.render();
		});
		return this;
	}

	/**
	 * Updates the observer's longitude.
	 *
	 * @param longitude - The new longitude in degrees.
	 * @returns The SkyMap instance for chaining.
	 */
	public setLongitude(longitude: number): this {
		if (!validateLongitude(longitude)) {
			throw new Error("Invalid longitude value");
		}

		this.updateLongitude(longitude);
		this.updateDate().then((ok) => {
			if (ok) this.render();
		});
		return this;
	}

	/**
	 * Updates the sky map's date/time.
	 *
	 * @param date - The new date/time for astronomical calculations.
	 * @returns The SkyMap instance for chaining.
	 */
	public setDate(date: Date): this {
		this.updateDate(date).then((ok) => {
			if (ok) this.render();
		});
		return this;
	}

	/**
	 * Updates the field of view (FOV).
	 *
	 * @param fov - The new field of view in degrees.
	 * @returns The SkyMap instance for chaining.
	 */
	public setFov(fov: number): this {
		if (!validateFov(fov)) {
			throw new Error("Invalid fov value");
		}

		this.updateFov(fov);
		this.render();
		return this;
	}

	/**
	 * Replaces the current observer parameters with the given ones.
	 *
	 * @param observerParams - An object containing the new observer parameters:
	 *   - `latitude`: The new latitude in degrees.
	 *   - `longitude`: The new longitude in degrees.
	 *   - `date`: The new date/time for astronomical calculations.
	 *   - `fov`: The new field of view in degrees.
	 */
	public async setObserverParams(observerParams: ObserverParams): Promise<void> {
		if (!validateObserverParams(observerParams)) {
			throw new Error("Invalid observer parameters");
		}

		this.observerParams = observerParams;
		this.updateLatitude(observerParams.latitude);
		this.updateLongitude(observerParams.longitude);
		this.updateFov(observerParams.fov);
		await this.updateDate(observerParams.date);
		this.render();
	}

	private animationFrameId: number | null = null;
	private animate<T>(
		startValue: T,
		targetValue: T,
		duration: number,
		update: (value: T) => void,
		lerp: (start: T, end: T, progress: number) => T,
	): this {
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
		}

		const startTime = performance.now();

		const step = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1); // Normalize to [0,1]
			const easedProgress = easeProgress(progress);
			const newValue = lerp(startValue, targetValue, easedProgress);

			update(newValue);

			if (progress < 1) {
				this.animationFrameId = requestAnimationFrame(step);
			} else {
				this.animationFrameId = null;
			}
		};

		this.animationFrameId = requestAnimationFrame(step);
		return this;
	}

	/**
	 * Animates the change of location (latitude and longitude) over a specified duration.
	 *
	 * @param latitude - The new latitude in degrees.
	 * @param longitude - The new longitude in degrees.
	 * @param duration - Duration of the animation in milliseconds.
	 * @returns The SkyMap instance for chaining.
	 */
	public setLocationWithAnimation(latitude: number, longitude: number, duration: number): this {
		if (!validateLatitude(latitude) || !validateLongitude(longitude)) {
			throw new Error("Invalid latitude or longitude value");
		}

		const startLat = this.latitude.deg;
		const startLst = this.lst.deg;

		const finalLst = this.date.LST(longitude) % 360;
		this.longitude = Angle.fromDegrees(longitude);
		this.observerParams.longitude = longitude;

		return this.animate<[number, number]>(
			[startLat, startLst],
			[latitude, finalLst],
			duration,
			([newLat, newLst]) => {
				this.lst = Angle.fromDegrees(newLst);
				this.updateLatitude(newLat);
				this.render();
			},
			(start, end, progress) => [lerpAngle(start[0], end[0], progress), lerpAngle(start[1], end[1], progress)],
		);
	}

	/**
	 * Animates the change of date/time over a specified duration.
	 *
	 * @param date - The new date/time for astronomical calculations.
	 * @param duration - Duration of the animation in milliseconds.
	 * @returns The SkyMap instance for chaining.
	 */
	public setDateWithAnimation(date: Date, duration: number): this {
		const startLst = this.lst.deg;

		this.date = AstronomicalTime.fromUTCDate(date);
		const finalLst = this.date.LST(this.longitude.deg);

		return this.animate<number>(
			startLst,
			finalLst,
			duration,
			(newLst) => {
				this.lst = Angle.fromDegrees(newLst);
				this.render();
			},
			lerpAngle,
		);
	}

	/**
	 * Renders the whole map.
	 */
	public render(): void {
		this.drawBg();

		this.drawGrid();
		this.drawConstellationsLines();
		this.drawConstellationsBoundaries();
		this.drawStars();
		this.drawPlanets();
		this.drawSun();
		this.drawMoon();

		this.drawBorder();
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
		this.ctx.strokeStyle = this.cfg.bgColor;
		arcCircle(this.ctx, this.center, this.radius);
		this.ctx.stroke();
	}

	private drawConstellationsLines(): void {
		if (!this.cfg.constellations.lines.enabled || !this.constellationsLines) return;

		const fontSize = this.scaleMod * this.cfg.constellations.lines.labels.fontSize;
		this.ctx.font = `${fontSize}px ${this.cfg.fontFamily}`;
		this.ctx.strokeStyle = this.cfg.constellations.lines.color;
		this.ctx.lineWidth = this.cfg.constellations.lines.width * this.scaleMod;
		if (this.cfg.glow) {
			this.ctx.shadowBlur = 5;
			this.ctx.shadowColor = this.cfg.constellations.lines.color;
		}

		for (const constellation of this.constellationsLines) {
			this.ctx.beginPath();
			for (const group of constellation.coo) {
				for (let j = 0; j < group.length; j++) {
					const [raDeg, decDeg] = group[j];

					const { alt, az } = this.equatorialToHorizontal(degToRad(raDeg), degToRad(decDeg));
					const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

					if (alt < -20 || j === 0) {
						moveTo(this.ctx, coo);
					} else {
						lineTo(this.ctx, coo);
					}
				}
			}

			if (this.cfg.constellations.lines.labels.enabled && this.constellationsLabels !== undefined) {
				const constellationsLabel = this.constellationsLabels.get(constellation.id);
				if (!constellationsLabel) throw new Error("contellation label not found");

				const text = constellationsLabel.labels[this.cfg.language];
				if (text) {
					const textWidth = this.ctx.measureText(text).width;
					const [raDeg, decDeg] = constellationsLabel.coo;

					const { alt, az } = this.equatorialToHorizontal(degToRad(raDeg), degToRad(decDeg));
					const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

					this.ctx.fillStyle = this.cfg.constellations.lines.labels.color;
					this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - fontSize / 2);
				} else {
					throw new Error("constellation label for specified language not found");
				}
			}
			this.ctx.stroke();
		}
	}

	private drawConstellationsBoundaries(): void {
		if (!this.cfg.constellations.boundaries.enabled || !this.constellationsBoundaries) return;

		this.ctx.strokeStyle = this.cfg.constellations.boundaries.color;
		this.ctx.lineWidth = this.cfg.constellations.boundaries.width * this.scaleMod;
		if (this.cfg.glow) {
			this.ctx.shadowBlur = 5;
			this.ctx.shadowColor = this.cfg.constellations.boundaries.color;
		}

		for (const constellation of this.constellationsBoundaries) {
			this.ctx.beginPath();
			for (const group of constellation.coo) {
				for (let j = 0; j < group.length; j++) {
					const [raDeg, decDeg] = group[j];

					const { alt, az } = this.equatorialToHorizontal(degToRad(raDeg), degToRad(decDeg));
					const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

					if (alt < -45) {
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
		if (!this.cfg.planets.enabled) return;
		const fontSize = this.scaleMod * this.cfg.planets.labels.fontSize;
		this.ctx.font = `${fontSize}px ${this.cfg.fontFamily}`;

		for (const planet of planets) {
			const equatorial = Equator(planet.body, this.date.UTCDate, this.observer, true, true);

			const ra = hoursToRad(equatorial.ra);
			const dec = degToRad(equatorial.dec);

			const { alt, az } = this.equatorialToHorizontal(ra, dec);
			const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

			const color = this.cfg.planets.color !== undefined ? this.cfg.planets.color : planet.color;
			if (this.cfg.glow) {
				this.ctx.shadowBlur = 10;
				this.ctx.shadowColor = color;
			}

			const radius = (planet.radius * this.scaleMod * this.cfg.planets.scale) / this.fovFactor;
			this.drawDisk(coo, radius, color);

			if (this.cfg.planets.labels.enabled && this.planetLabels !== undefined) {
				const text = this.planetLabels[planet.id][this.cfg.language];
				if (text) {
					const textWidth = this.ctx.measureText(text).width;
					this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - radius - fontSize / 2);
				} else {
					throw new Error("planet label for specified language not found");
				}
			}
		}
	}

	private drawMoon(): void {
		if (!this.cfg.moon.enabled) return;

		const fontSize = this.scaleMod * this.cfg.moon.label.fontSize;
		this.ctx.font = `${fontSize}px ${this.cfg.fontFamily}`;

		const equatorial = Equator(Body.Moon, this.date.UTCDate, this.observer, true, true);

		const ra = hoursToRad(equatorial.ra);
		const dec = degToRad(equatorial.dec);

		const { alt, az } = this.equatorialToHorizontal(ra, dec);
		const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

		const color = this.cfg.moon.color;
		if (this.cfg.glow) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = color;
		}

		const rad = (4 * this.scaleMod * this.cfg.moon.scale) / this.fovFactor;

		this.drawDisk(coo, rad, color);
		if (this.cfg.planets.labels.enabled && this.moonLabels) {
			const text = this.moonLabels[this.cfg.language];
			if (text) {
				const textWidth = this.ctx.measureText(text).width;
				this.ctx.fillStyle = this.cfg.moon.label.color;
				this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - rad * 1.5);
			} else {
				throw new Error("moon label for specified language not found");
			}
		}
	}

	private drawSun(): void {
		if (!this.cfg.sun.enabled) return;

		const fontSize = this.scaleMod * this.cfg.sun.label.fontSize;
		this.ctx.font = `${fontSize}px ${this.cfg.fontFamily}`;

		const equatorial = Equator(Body.Sun, this.date.UTCDate, this.observer, true, true);

		const raRad = hoursToRad(equatorial.ra);
		const decRad = degToRad(equatorial.dec);

		const { alt, az } = this.equatorialToHorizontal(raRad, decRad);
		const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

		const color = this.cfg.sun.color;
		if (this.cfg.glow) {
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = color;
		}
		const rad = (8 * this.scaleMod * this.cfg.sun.scale) / this.fovFactor;

		this.drawDisk(coo, rad, color);

		if (this.cfg.planets.labels.enabled && this.sunLabels) {
			const text = this.sunLabels[this.cfg.language];
			if (text) {
				const textWidth = this.ctx.measureText(text).width;
				this.ctx.fillStyle = this.cfg.sun.label.color;
				this.ctx.fillText(text, coo.x - textWidth / 2, coo.y - rad * 1.5);
			} else {
				throw new Error("sun label for specified language not found");
			}
		}
	}

	private drawBg(): void {
		this.ctx.fillStyle = this.cfg.bgColor;
		this.ctx.fillRect(0, 0, this.radius * 2, this.radius * 2);
	}

	private drawStars(): void {
		if (!this.cfg.stars.enabled || !this.stars) return;

		for (const star of this.stars.stars) {
			const { alt, az } = this.equatorialToHorizontal(degToRad(star.lon), degToRad(star.lat));
			if (alt < 0) continue;

			const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);

			// star with mag = -1.44 will have size 8
			const size =
				((8 / 1.18 ** (star.mag + this.stars.mag.max)) * this.scaleMod * this.cfg.stars.scale) / this.fovFactor;
			const color = this.cfg.stars.color !== undefined ? this.cfg.stars.color : bvToRGB(star.bv);

			if (this.cfg.glow) {
				this.ctx.shadowBlur = 10;
				this.ctx.shadowColor = color;
			}

			this.drawDisk(coo, size, color);
		}
	}

	private drawGrid(): void {
		if (!this.cfg.grid.enabled) return;

		this.ctx.strokeStyle = this.cfg.grid.color;
		this.ctx.lineWidth = this.cfg.grid.width * this.scaleMod;

		for (let raRad = 0; raRad < 24; raRad += 1) {
			this.ctx.beginPath();
			const decStart = raRad % 6 === 0 ? -18 : -16;

			for (let decRad = decStart; decRad <= -decStart; decRad += 1) {
				const { alt, az } = this.equatorialToHorizontal((raRad * Math.PI) / 12, (decRad * Math.PI) / 36);

				if (Math.abs(this.latitude.deg) < 1) {
					if (alt < 0) {
						continue;
					}
				} else {
					if (alt < -1) {
						continue;
					}
				}

				const coo = projectSphericalTo2D(this.center, alt, az, this.radius / this.fovFactor);
				lineTo(this.ctx, coo);
			}
			this.ctx.stroke();
		}

		this.ctx.beginPath();
		for (let decRad = -4; decRad <= 4; decRad += 1) {
			let firstPointVisible = false;

			for (let raRad = 0; raRad <= 72; raRad += 1) {
				const { alt, az } = this.equatorialToHorizontal((raRad * Math.PI) / 36, (decRad * Math.PI) / 9);

				if (alt < -3) {
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

	private getObserver(): Observer {
		return new Observer(this.latitude.deg, this.longitude.deg, 0);
	}

	private getLST(): number {
		const res = this.date.LST(this.longitude.deg);
		return res;
	}

	private updateLongitude(longitude: number): void {
		this.longitude = Angle.fromDegrees(longitude);
		this.observerParams.longitude = longitude;
		this.observer = this.getObserver();
	}

	private updateLatitude(latitude: number): void {
		this.latitude = this.calculateAngleWithSinAndCos(latitude);
		this.observerParams.latitude = latitude;

		this.observer = this.getObserver();
	}

	private lastGeoTzFindCallId = 0;
	private async updateDate(date?: Date): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const callId = ++this.lastGeoTzFindCallId;

			this.geoTz
				.find(this.latitude.deg, this.longitude.deg)
				.then(([tz]) => {
					if (callId !== this.lastGeoTzFindCallId) {
						resolve(false);
					}

					const timezonedDate = new Date(
						(date !== undefined ? date : this.observerParams.date).toLocaleString("en-us", {
							timeZone: tz,
						}),
					);

					if (date !== undefined) {
						this.observerParams.date = date;
					}

					this.date = AstronomicalTime.fromUTCDate(timezonedDate);
					this.lst = Angle.fromDegrees(this.getLST());
					resolve(true);
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	private updateFov(fov: number): void {
		this.observerParams.fov = fov;
		this.fovFactor = getFovFactor(fov);
	}

	private equatorialToHorizontal(
		ra: number,
		dec: number,
	): {
		alt: number;
		az: number;
	} {
		const ha = ra - this.lst.ra;

		const sinDec = Math.sin(dec);
		const cosDec = Math.cos(dec);
		const sinHa = Math.sin(ha);
		const cosHa = Math.cos(ha);

		const sinAlt = sinDec * this.latitude.sin + cosDec * this.latitude.cos * cosHa;
		const alt = Math.asin(sinAlt);
		const altDeg = radToDeg(alt);

		if (this.latitude.deg === 90) {
			return {
				alt: altDeg,
				az: ha + Math.PI,
			};
		}
		if (this.latitude.deg === -90) {
			return {
				alt: altDeg,
				az: -ha,
			};
		}

		const cosAlt = Math.cos(alt);

		const cosAz = (sinDec - this.latitude.sin * sinAlt) / (this.latitude.cos * cosAlt);
		const sinAz = (-sinHa * cosDec) / cosAlt;
		const az = Math.atan2(sinAz, cosAz);

		return { alt: altDeg, az };
	}
}
