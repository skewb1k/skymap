import type Star from "./Star.type";

type StarsData = {
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

export default StarsData;
