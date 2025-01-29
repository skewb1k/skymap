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
	starsTemperature?: boolean; //? rename
	constellationLinesColor?: string;
	constellationLinesWidth?: number;
	showConstellations?: boolean;
	constellationBordersColor?: string;
	constellationBordersWidth?: number;
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

	private gridColor: string;
	private gridWidth: number;
	private starColor: string;
	private bgColor: string;
	private constellationLinesColor: string;
	private constellationLinesWidth: number;
	private constellationBordersColor: string;
	private constellationBordersWidth: number;

	private stars: StarsData;
	private constellationsLines: ConstellationLine[];
	private constellationsBorders: ConstellationBorder[];

	private starColors: boolean;

	constructor(container: HTMLDivElement, options: SkyMapOptions = {}) {
		const {
			latitude = 0,
			longitude = 0,
			datetime = new Date(),
			fov = 180,
			gridColor = "#333",
			gridWidth = 2,
			starColor = "#fefefe",
			bgColor = "#000000",
			starsTemperature = false,
			constellationLinesColor = "#fefefe",
			constellationLinesWidth = 1,
			constellationBordersColor = "#aaa",
			constellationBordersWidth = 1,
		} = options;

		this.container = container;

		const canvas = document.createElement("canvas");
		canvas.width = this.container.offsetWidth;
		canvas.height = this.container.offsetHeight;
		this.container.appendChild(canvas);

		this.radius = Math.min(canvas.width, canvas.height) / 2;
		this.center = { x: canvas.width / 2, y: canvas.height / 2 };

		this.drawer = new Drawer(canvas, this.radius / 400);

		this.gridColor = gridColor;
		this.gridWidth = gridWidth;
		this.starColor = starColor;
		this.bgColor = bgColor;
		this.constellationLinesColor = constellationLinesColor;
		this.constellationLinesWidth = constellationLinesWidth;
		this.starColors = starsTemperature;
		this.constellationBordersColor = constellationBordersColor;
		this.constellationBordersWidth = constellationBordersWidth;

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

	private updateLST() {
		this.lst = this.datetime.LST(this.longitude);
	}

	private render(): void {
		this.drawBg();
		this.drawGrid();
		this.drawStars();
		this.drawConstellationsLines();
		this.drawConstellationsBorders();
	}

	private drawConstellationsLines(): void {
		this.drawer.setColor(this.constellationLinesColor);
		this.drawer.setLineWidth(this.constellationLinesWidth);
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

					if (alt.degrees < -45 || j === 0) {
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
		this.drawer.setColor(this.constellationBordersColor);
		this.drawer.setLineWidth(this.constellationBordersWidth);

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
			this.radius,
			this.bgColor,
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
		this.drawer.setColor(this.gridColor);
		this.drawer.setLineWidth(this.gridWidth);

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
		// if (star.mag > 5) return;
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
		const size = 8 / 1.25 ** (star.mag + this.stars.mag.max) / this.fovFactor;

		const color = this.starColors ? bvToRGB(star.bv) : this.starColor;

		this.drawer.drawDisk(coo, size, color);
	}
}
