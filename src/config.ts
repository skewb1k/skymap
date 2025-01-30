export type Config = {
	stars: {
		enabled: boolean;
		color: string;
		size: number;
		monochrome: boolean;
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
		borders: {
			enabled: boolean;
			color: string;
			width: number;
		};
	};
	planets: {
		enabled: boolean;
		size: number;
		monochrome: boolean;
	};
	sun: {
		enabled: boolean;
		size: number;
		monochrome: boolean;
	};
	moon: {
		enabled: boolean;
		size: number;
		monochrome: boolean;
	};
	bgColor: string;
	glow: boolean;
};

export const defaultConfig: Config = {
	bgColor: "#000000",
	glow: false,
	stars: {
		enabled: true,
		color: "#fefefe",
		size: 1,
		monochrome: true,
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
		borders: {
			enabled: false,
			color: "#aaa",
			width: 1,
		},
	},
	moon: {
		enabled: true,
		size: 1,
		monochrome: false,
	},
	sun: {
		enabled: true,
		size: 1,
		monochrome: false,
	},
	planets: {
		enabled: true,
		size: 1,
		monochrome: false,
	},
};
