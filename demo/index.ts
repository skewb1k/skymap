// @ts-ignore
import { SkyMap } from "../src/SkyMap/SkyMap";

const latRange = document.querySelector("#latitude-range") as HTMLInputElement;
const latInput = document.querySelector("#latitude-input") as HTMLInputElement;
const lonRange = document.querySelector("#longitude-range") as HTMLInputElement;
const lonInput = document.querySelector("#longitude-input") as HTMLInputElement;
const fovRange = document.querySelector("#fov-range") as HTMLInputElement;
const fovInput = document.querySelector("#fov-input") as HTMLInputElement;
const dateInput = document.querySelector("#datetime") as HTMLInputElement;

const randomLocation = document.querySelector("#random-location") as HTMLInputElement;
const randomTime = document.querySelector("#random-time") as HTMLInputElement;

const gridCheckbox = document.querySelector("#grid") as HTMLInputElement;
const starsCheckbox = document.querySelector("#stars") as HTMLInputElement;
const constellationsLinesCheckbox = document.querySelector("#constellations-lines") as HTMLInputElement;
const constellationsBoundariesCheckbox = document.querySelector("#constellations-boundaries") as HTMLInputElement;

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const hours = String(now.getHours()).padStart(2, "0");
const minutes = String(now.getMinutes()).padStart(2, "0");

dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;

const container = document.querySelector("#container") as HTMLDivElement;
const skymap = await SkyMap.create(
	container,
	{
		latitude: Number(latInput.value),
		longitude: Number(lonInput.value),
		date: new Date(dateInput.value),
	},
	{
		bgColor: "#0a0d13",
		// fontFamily: "Roboto",
		// glow: true,
		constellations: {
			lines: {
				// color: "#64C8FF66",
				labels: {
					enabled: true,
					// fontSize: 20,
				},
			},
		},
		// language: "ru",
		// stars: {
		// 	color: "#fff",
		// },
	},
);

randomLocation.onclick = () => {
	const lat = Math.random() * 180 - 90;
	const lon = Math.random() * 360 - 180;
	skymap.setLocationWithAnimation(lat, lon, 500, (lat, lon) => {
		latInput.value = lat.toFixed(2);
		latRange.value = lat.toFixed(2);
		lonInput.value = lon.toFixed(2);
		lonRange.value = lon.toFixed(2);
	});
};

randomTime.onclick = () => {
	// random date
	const date = new Date(
		Math.random() * (new Date(year + 1, 1, 1).getTime() - new Date(year, 1, 1).getTime()) +
			new Date(year, 1, 1).getTime(),
	);
	dateInput.value = date.toISOString().slice(0, 16);
	skymap.setDate(date);
	// sm.animateDate(date, 10000, (date) => {
	// 	dateInput.value = date.toISOString().slice(0, 16);
	// });
};

gridCheckbox.addEventListener("change", () => {
	skymap.cfg.grid.enabled = gridCheckbox.checked;
});

starsCheckbox.addEventListener("change", () => {
	skymap.cfg.stars.enabled = starsCheckbox.checked;
});

constellationsLinesCheckbox.addEventListener("change", () => {
	skymap.cfg.constellations.lines.enabled = constellationsLinesCheckbox.checked;
});

constellationsBoundariesCheckbox.addEventListener("change", () => {
	skymap.cfg.constellations.boundaries.enabled = constellationsBoundariesCheckbox.checked;
});

fovRange.addEventListener("input", () => {
	skymap.setFov(Number(fovRange.value));
	fovInput.value = fovRange.value;
});

fovInput.addEventListener("input", () => {
	skymap.setFov(Number(fovInput.value));
	fovRange.value = fovInput.value;
});

latRange.addEventListener("input", () => {
	skymap.setLatitude(Number(latRange.value));
	latInput.value = latRange.value;
});

latInput.addEventListener("input", () => {
	skymap.setLatitude(Number(latInput.value));
	latRange.value = latInput.value;
});

lonInput.addEventListener("input", () => {
	skymap.setLongitude(Number(lonInput.value));
	lonRange.value = lonInput.value;
});

lonRange.addEventListener("input", () => {
	skymap.setLongitude(Number(lonRange.value));
	lonInput.value = lonRange.value;
});

dateInput.addEventListener("input", () => {
	skymap.setDateWithAnimation(new Date(dateInput.value), 500, () => {});
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
