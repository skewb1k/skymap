import constellationsLinesData from "../data/constellations.lines.json";
import constellationsBordersData from "../data/constellations.borders.json";
import starsData from "../data/stars.6.json";
import { Angle } from "./Angle";
import AstronomicalTime from "./AstronomicalTime/AstronomicalTime";
import equatorialToHorizontal from "./helper/equatorialToHorizontal";
import { bvToRGB } from "./helper/color";
import type {
	ConstellationLine,
	ConstellationBorder,
} from "./types/Constellation.type";
import type { Coo } from "./types/Coo.type";
import type { Star } from "./types/Star.type";
import type { StarsData } from "./types/StarsData.type";
import Drawer from "./Drawer";

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
	colorConfig?: ColorConfig;
	linesConfig?: LinesConfig;
};

export class SkyMap {
	private container: HTMLDivElement;
	private drawer: Drawer;

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
			colorConfig = {
				gridColor: "#333",
				starColor: "#fefefe",
				bgColor: "#000000",
				starsTemperature: false,
				constellationLinesColor: "#fefefe",
				constellationBordersColor: "#aaa",
			},
			linesConfig = {
				constellationLinesWidth: 1,
				constellationBordersWidth: 1,
				gridWidth: 1,
			},
		} = options;

		this.container = container;
		this.colorConfig = colorConfig;
		this.linesConfig = linesConfig;
		this.showConstellationsBorders = showConstellationsBorders;
		this.showConstellationsLines = showConstellationsLines;
		this.showStars = showStars;
		this.showGrid = showGrid;

		// const canvas = document.createElement("canvas");
		// canvas.width = this.container.offsetWidth;
		// canvas.height = this.container.offsetHeight;
		// this.container.appendChild(canvas);

		const canvas = this.container.querySelector("canvas");
		if (!canvas) {
			throw new Error("Canvas not found");
		}
		canvas.width = this.container.offsetWidth;
		canvas.height = this.container.offsetHeight;

		this.radius = Math.min(canvas.width, canvas.height) / 2;
		this.center = { x: canvas.width / 2, y: canvas.height / 2 };

		this.drawer = new Drawer(canvas, this.radius / 400);

		this.latitude = Angle.fromDegrees(latitude);
		this.longitude = Angle.fromDegrees(longitude);
		this.datetime = AstronomicalTime.fromUTCDate(datetime);
		this.fov = fov;
		this.fovFactor = Math.tan(Angle.fromDegrees(this.fov / 4).radians);

		this.lst = this.datetime.LST(this.longitude);

		this.stars = starsData;
		this.constellationsLines = constellationsLinesData.map((constellation) => ({
			...constellation,
			vertices: constellation.vertices.map((group) =>
				group.map((pair) => pair as [number, number]),
			),
		}));

		this.constellationsBorders = constellationsBordersData.map(
			(constellation) => ({
				...constellation,
				vertices: constellation.vertices.map((group) =>
					group.map((pair) => pair as [number, number]),
				),
			}),
		);

		this.drawer.clipCircle();

		this.render();
	}

	private render(): void {
		this.drawer.clear();
		this.drawBg();
		if (this.showGrid) this.drawGrid();
		if (this.showStars) this.drawStars();
		if (this.showConstellationsLines) this.drawConstellationsLines();
		if (this.showConstellationsBorders) this.drawConstellationsBorders();
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
		this.drawer.setColor(this.colorConfig.constellationLinesColor);
		this.drawer.setLineWidth(this.linesConfig.constellationLinesWidth);
		this.constellationsLines.forEach((constellation) => {
			this.drawer.beginPath();
			for (const group of constellation.vertices) {
				for (let j = 0; j < group.length; j++) {
					const [raDeg, decDeg] = group[j];
					const ra = Angle.fromDegrees(raDeg);
					const dec = Angle.fromDegrees(decDeg);

					const { alt, az } = equatorialToHorizontal(
						ra,
						dec,
						this.latitude,
						this.lst,
					);

					const coo = this.project(alt, az);

					if (alt.degrees < -20 || j === 0) {
						this.drawer.moveTo(coo);
					} else {
						this.drawer.lineTo(coo);
					}
				}
			}
			this.drawer.stroke();
		});
	}

	private drawConstellationsBorders(): void {
		this.drawer.setColor(this.colorConfig.constellationBordersColor);
		this.drawer.setLineWidth(this.linesConfig.constellationBordersWidth);

		this.constellationsBorders.forEach((constellation) => {
			this.drawer.beginPath();
			for (const group of constellation.vertices) {
				for (let j = 0; j < group.length; j++) {
					const [raDeg, decDeg] = group[j];
					const ra = Angle.fromDegrees(raDeg);
					const dec = Angle.fromDegrees(decDeg);

					const { alt, az } = equatorialToHorizontal(
						ra,
						dec,
						this.latitude,
						this.lst,
					);

					const coo = this.project(alt, az);

					if (alt.degrees < -45) {
						this.drawer.moveTo(coo);
					} else {
						this.drawer.lineTo(coo);
					}
				}
			}
			this.drawer.stroke();
		});
	}

	private drawBg(): void {
		this.drawer.drawDisk(
			{ x: this.radius, y: this.radius },
			this.radius * 1.01,
			this.colorConfig.bgColor,
		);
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
		this.drawer.setColor(this.colorConfig.gridColor);
		this.drawer.setLineWidth(this.linesConfig.gridWidth);

		for (let raDeg = 0; raDeg < 360; raDeg += 15) {
			const ra = Angle.fromDegrees(raDeg);
			this.drawer.beginPath();

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
				this.drawer.lineTo(coo);
			}

			this.drawer.stroke();
		}

		for (let decDeg = -80; decDeg <= 80; decDeg += 20) {
			const dec = Angle.fromDegrees(decDeg);
			this.drawer.beginPath();
			let firstPointVisible = false;

			for (let raDeg = 0; raDeg <= 360; raDeg += 2) {
				const ra = Angle.fromDegrees(raDeg);
				const { alt, az } = equatorialToHorizontal(
					ra,
					dec,
					this.latitude,
					this.lst,
				);

				if (alt.degrees < -3) {
					firstPointVisible = false;
					continue;
				}

				const coo = this.project(alt, az);
				if (!firstPointVisible) {
					this.drawer.moveTo(coo);
					firstPointVisible = true;
				} else {
					this.drawer.lineTo(coo);
				}
			}

			this.drawer.stroke();
		}
	}

	private drawStar(star: Star): void {
		if (star.mag > 5.2) return;
		const starRa = Angle.fromDegrees(star.lon);
		const starDec = Angle.fromDegrees(star.lat);

		const { alt, az } = equatorialToHorizontal(
			starRa,
			starDec,
			this.latitude,
			this.lst,
		);

		if (alt.degrees < -2) return;

		const coo = this.project(alt, az);

		// star with mag = -1.44 will have size 8
		const size = 8 / 1.2 ** (star.mag + this.stars.mag.max) / this.fovFactor;
		const color = this.colorConfig.starsTemperature
			? bvToRGB(star.bv)
			: this.colorConfig.starColor;

		this.drawer.drawDisk(coo, size, color);
	}
}
