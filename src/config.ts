export type Config = {
	stars: {
		enabled: boolean;
		color: string | undefined;
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
			labels: {
				enabled: boolean;
				color: string;
			};
		};
		boundaries: {
			enabled: boolean;
			color: string;
			width: number;
		};
	};
	planets: {
		enabled: boolean;
		size: number;
		color: string | undefined;
		labels: {
			enabled: boolean;
			color: string;
		};
	};
	sun: {
		enabled: boolean;
		size: number;
		color: string;
		label: {
			enabled: boolean;
			color: string;
		};
	};
	moon: {
		enabled: boolean;
		size: number;
		color: string;
		label: {
			enabled: boolean;
			color: string;
		};
	};
	bgColor: string;
	glow: boolean;
};

export const defaultConfig: Config = {
	bgColor: "#000000",
	glow: false,
	stars: {
		enabled: true,
		color: undefined,
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
			labels: {
				enabled: true,
				color: "#fefefe",
			},
		},
		boundaries: {
			enabled: false,
			color: "#aaa",
			width: 1,
		},
	},
	moon: {
		enabled: true,
		size: 1,
		color: "#eaeaea",
		label: {
			enabled: true,
			color: "#fefefe",
		},
	},
	sun: {
		enabled: true,
		size: 1,
		color: "#ffe484",
		label: {
			enabled: true,
			color: "#fefefe",
		},
	},
	planets: {
		enabled: true,
		size: 1,
		color: undefined,
		labels: {
			enabled: true,
			color: "#fefefe",
		},
	},
};
