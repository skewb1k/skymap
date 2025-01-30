export type Config = {
	stars: {
		enabled: boolean;
		color: string;
		size: number;
	};
	grid: {
		enabled: boolean;
		color: string;
		width: number;
	};
	constellations: {
		lines: {
			enabled: boolean;
			color: string;
			width: number;
		};
		boundaries: {
			enabled: boolean;
			color: string;
			width: number;
		};
		labels: boolean;
	};
	planets: {
		enabled: boolean;
		size: number;
		labels: boolean;
	};
	sun: {
		enabled: boolean;
		size: number;
		label: boolean;
	};
	moon: {
		enabled: boolean;
		size: number;
		label: boolean;
	};
	bgColor: string;
	monochrome: boolean;
	glow: boolean;
};

export const defaultConfig: Config = {
	bgColor: "#000000",
	glow: false,
	monochrome: true,
	stars: {
		enabled: true,
		color: "#fefefe",
		size: 1,
	},
	grid: {
		enabled: true,
		color: "#555",
		width: 1,
	},
	constellations: {
		lines: {
			enabled: true,
			color: "#eaeaea",
			width: 2,
		},
		boundaries: {
			enabled: false,
			color: "#aaa",
			width: 1,
		},
		labels: true,
	},
	moon: {
		enabled: true,
		size: 1,
		label: true,
	},
	sun: {
		enabled: true,
		size: 1,
		label: true,
	},
	planets: {
		enabled: true,
		size: 1,
		labels: true,
	},
};
