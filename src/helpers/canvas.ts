import type Coo from "../types/Coo.type";

export function arcCircle(ctx: CanvasRenderingContext2D, coo: Coo, radius: number): void {
	ctx.arc(coo.x, coo.y, radius, 0, Math.PI * 2);
}

export function lineTo(ctx: CanvasRenderingContext2D, p: Coo) {
	ctx.lineTo(p.x, p.y);
}

export function moveTo(ctx: CanvasRenderingContext2D, p: Coo) {
	ctx.moveTo(p.x, p.y);
}
