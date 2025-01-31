export function bvToRGB(bv: number): string {
	let r = 0;
	let g = 0;
	let b = 0;

	if (bv < 0.0) {
		// O & B-type stars (Slight Blue-White)
		r = 0.8 + 0.2 * bv;
		g = 0.85 + 0.15 * bv;
		b = 1.0;
	} else if (bv < 0.3) {
		// A-type stars (Pure White)
		r = 0.98;
		g = 0.98;
		b = 1.0 - 0.1 * bv;
	} else if (bv < 0.6) {
		// F-type stars (Warm White)
		r = 1.0;
		g = 0.96 - 0.2 * (bv - 0.3);
		b = 0.9 - 0.1 * (bv - 0.3);
	} else if (bv < 1.0) {
		// G-type stars (Slight Yellow-White, like the Sun)
		r = 1.0;
		g = 0.9 - 0.2 * (bv - 0.6);
		b = 0.85 - 0.15 * (bv - 0.6);
	} else if (bv < 1.5) {
		// K-type stars (Soft Warm White, Slight Orange)
		r = 1.0;
		g = 0.8 - 0.15 * (bv - 1.0);
		b = 0.7 - 0.2 * (bv - 1.0);
	} else {
		// M-type stars (Very Slight Orange, Nearly White)
		r = 1.0;
		g = 0.75 - 0.1 * (bv - 1.5);
		b = 0.65 - 0.1 * (bv - 1.5);
	}

	// Convert to 8-bit color values (0–255)
	return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}
