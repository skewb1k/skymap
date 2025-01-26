import { SkyMap } from "../src/index";

const container = document.querySelector("#container") as HTMLDivElement;
new SkyMap(container, {
	latitude: 70,
	longitude: 10,
	datetime: new Date(2024, 12, 1, 9, 47),
});

// Get the DPR and size of the canvas
// const dpr = window.devicePixelRatio;
// const rect = canvas.getBoundingClientRect();

// Set the "actual" size of the canvas
// canvas.width = rect.width * dpr;
// canvas.height = rect.height * dpr;

// Scale the context to ensure correct drawing operations
// ctx.scale(dpr, dpr);

// Set the "drawn" size of the canvas
// canvas.style.width = `${rect.width}px`;
// canvas.style.height = `${rect.height}px`;

// for (let ra = 0; ra < 24; ra++) {
// 	const angle = (ra / 24) * Math.PI * 2; // Convert RA to radians
// 	const x = center.x + radius * Math.cos(angle);
// 	const y = center.y - radius * Math.sin(angle);
// 	ctx.beginPath();
// 	ctx.moveTo(center.x, center.y);
// 	ctx.lineTo(x, y);
// 	ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
// 	ctx.stroke();
// }

// for (let dec = -80; dec <= 80; dec += 10) {
// 	const r = (radius * (90 - Math.abs(dec))) / 90;
// 	ctx.beginPath();
// 	ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
// 	ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
// 	ctx.stroke();
// }
