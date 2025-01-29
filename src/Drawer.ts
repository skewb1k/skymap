import type { Coo } from "./types/Coo.type";

export default class Drawer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	private scaleMod: number;

	constructor(canvas: HTMLCanvasElement, scaleMod: number) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		this.scaleMod = scaleMod;
	}

	beginPath(): void {
		this.ctx.beginPath();
	}

	closePath(): void {
		this.ctx.closePath();
	}

	stroke(): void {
		this.ctx.stroke();
	}

	arcCircle(coo: Coo, radius: number): void {
		this.ctx.arc(coo.x, coo.y, radius, 0, Math.PI * 2);
	}

	clear(): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	drawCircle(coo: Coo, radius: number, color: string, width: number): void {
		this.ctx.beginPath();
		const wi = width * this.scaleMod;
		this.ctx.lineWidth = wi;
		this.ctx.strokeStyle = color;
		this.arcCircle(coo, radius - wi / 2);
		this.ctx.stroke();
		this.ctx.closePath();
	}

	setLineWidth(width: number): void {
		this.ctx.lineWidth = width * this.scaleMod;
	}

	setColor(color: string): void {
		this.ctx.strokeStyle = color;
	}

	drawDisk(coo: Coo, radius: number, color: string): void {
		this.ctx.beginPath();
		this.ctx.fillStyle = color;
		this.arcCircle(coo, radius);
		this.ctx.fill();
		this.ctx.closePath();
	}

	moveTo(p: Coo) {
		this.ctx.moveTo(p.x, p.y);
	}

	lineTo(p: Coo) {
		this.ctx.lineTo(p.x, p.y);
	}

	clipCircle(): void {
		this.ctx.beginPath();
		this.arcCircle(
			{ x: this.canvas.width / 2, y: this.canvas.height / 2 },
			this.canvas.width / 2,
		);
		this.ctx.clip();
		this.ctx.closePath();
	}
}
