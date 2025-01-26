import type { Star } from "./Star.type";

export type StarsData = {
	mag: {
		min: number;
		max: number;
	};
	bv: {
		min: number;
		max: number;
	};
	total: number;
	stars: Star[];
};
