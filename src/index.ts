type Coo = {
	x: number;
	y: number;
};

export class SkyMap {
	private container: HTMLDivElement;
	private canvas: HTMLCanvasElement;
	private radius: number;
	private center: Coo;
	private ctx: CanvasRenderingContext2D;

	constructor(container: HTMLDivElement) {
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

		this.drawBg();
	}

	private drawCircle(coo: Coo, radius: number) {
		this.ctx.arc(coo.x, coo.y, radius, 0, Math.PI * 2);
	}

	private drawBg() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear previous drawings
		this.ctx.beginPath();
		this.drawCircle(this.center, this.radius);
		this.ctx.fillStyle = "#000"; // Black color
		this.ctx.fill();
	}
}
