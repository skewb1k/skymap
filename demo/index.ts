const cc = document.body.querySelector("#container");
if (!cc) {
	throw new Error("Container not found");
}
const container = cc as HTMLDivElement;

const c = container.querySelector("canvas");
if (!c) {
	throw new Error("Canvas not found");
}
const canvas = c;

const ctxx = canvas.getContext("2d");
if (!ctxx) {
	throw new Error("Canvas context not found");
}

const ctx = ctxx;

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

function resizeCanvas() {
	canvas.width = container.offsetWidth;
	canvas.height = container.offsetHeight;
}
// Draw a black circle
function drawCircle() {
	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;
	const radius = Math.min(canvas.width, canvas.height) / 2; // Adjust size relative to canvas

	ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); // Circle at the center
	ctx.fillStyle = "#000"; // Black color
	ctx.fill();
}

resizeCanvas();
drawCircle();
