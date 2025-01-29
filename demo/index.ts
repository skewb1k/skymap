import { SkyMap } from "../src/index";

const latRange = document.querySelector("#latitude-range") as HTMLInputElement;
const latInput = document.querySelector("#latitude-input") as HTMLInputElement;
const lonRange = document.querySelector("#longitude-range") as HTMLInputElement;
const lonInput = document.querySelector("#longitude-input") as HTMLInputElement;
const fovRange = document.querySelector("#fov-range") as HTMLInputElement;
const fovInput = document.querySelector("#fov-input") as HTMLInputElement;
const dateInput = document.querySelector("#datetime") as HTMLInputElement;

const gridCheckbox = document.querySelector("#grid") as HTMLInputElement;
const starsCheckbox = document.querySelector("#stars") as HTMLInputElement;
const constellationsLinesCheckbox = document.querySelector(
	"#constellations-lines",
) as HTMLInputElement;
const constellationsBordersCheckbox = document.querySelector(
	"#constellations-borders",
) as HTMLInputElement;

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const hours = String(now.getHours()).padStart(2, "0");
const minutes = String(now.getMinutes()).padStart(2, "0");

dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;

const container = document.querySelector("#container") as HTMLDivElement;

const sm = new SkyMap(container, {
	latitude: Number(latInput.value),
	longitude: Number(lonInput.value),
	datetime: new Date(dateInput.value),
	colorConfig: {
		bgColor: "#0a0d13",
	},
	// constellationBordersColor: "#f00",
	// gridColor: "#f00",
	// constellationLinesColor: "#f00",
});

gridCheckbox.addEventListener("change", () => {
	sm.setShowGrid(gridCheckbox.checked);
});

starsCheckbox.addEventListener("change", () => {
	sm.setShowStars(starsCheckbox.checked);
});

constellationsLinesCheckbox.addEventListener("change", () => {
	sm.setShowConstellationsLines(constellationsLinesCheckbox.checked);
});

constellationsBordersCheckbox.addEventListener("change", () => {
	sm.setShowConstellationsBorders(constellationsBordersCheckbox.checked);
});

fovRange.addEventListener("input", () => {
	sm.setFov(Number(fovRange.value));
	fovInput.value = fovRange.value;
});

fovInput.addEventListener("input", () => {
	sm.setFov(Number(fovInput.value));
	fovRange.value = fovInput.value;
});

latRange.addEventListener("input", () => {
	sm.setLatitude(Number(latRange.value));
	latInput.value = latRange.value;
});

latInput.addEventListener("input", () => {
	sm.setLatitude(Number(latInput.value));
	latRange.value = latInput.value;
});

lonInput.addEventListener("input", () => {
	sm.setLongitude(Number(lonInput.value));
	lonRange.value = lonInput.value;
});

lonRange.addEventListener("input", () => {
	sm.setLongitude(Number(lonRange.value));
	lonInput.value = lonRange.value;
});

dateInput.addEventListener("input", () => {
	sm.setDatetime(new Date(dateInput.value));
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
