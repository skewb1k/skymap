export function bvToRGB(bv: number): string {
	// B-V color index to RGB conversion
	// Based on realistic stellar color transformation
	const temp = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

	let r = 0;
	let g = 0;
	let b = 0;

	if (temp <= 6000) {
		// todo: adjust colors, maybe accound magnitude
		r = 1;
		g = 0.3 * Math.log(temp / 100 - 10);
		b = 0.5;
	} else {
		r = 1.0;
		g = 0.9;
		b = 0.4 * Math.log(temp / 100 - 56);
	}

	// console.log(Math.round(r * 255));
	// Ensure values are within 0-255 range
	r = Math.max(0, Math.min(255, Math.round(r * 255)));
	g = Math.max(0, Math.min(255, Math.round(g * 255)));
	b = Math.max(0, Math.min(255, Math.round(b * 255)));

	return `rgb(${r}, ${g}, ${b})`;
}
