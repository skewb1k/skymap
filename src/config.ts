import type DeepPartial from "./helpers/DeepPartial";

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
				size: number;
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
			size: number;
			color: string;
		};
	};
	sun: {
		enabled: boolean;
		size: number;
		color: string;
		label: {
			enabled: boolean;
			size: number;
			color: string;
		};
	};
	moon: {
		enabled: boolean;
		size: number;
		color: string;
		label: {
			enabled: boolean;
			size: number;
			color: string;
		};
	};
	bgColor: string;
	fontFamily: string;
	language: string;
	glow: boolean;
};

export const defaultConfig: Config = {
	bgColor: "#000000",
	glow: false,
	fontFamily: "Arial",
	language: "en",
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
				size: 1,
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
			size: 1,
			color: "#fefefe",
		},
	},
	sun: {
		enabled: true,
		size: 1,
		color: "#ffe484",
		label: {
			enabled: true,
			size: 1,
			color: "#fefefe",
		},
	},
	planets: {
		enabled: true,
		size: 1,
		color: undefined,
		labels: {
			enabled: true,
			size: 1,
			color: "#fefefe",
		},
	},
};

/**
 * Merges two configuration objects (`cfg1` and `cfg2`) into a single configuration object.
 * Performs a deep merge, ensuring that nested properties are combined appropriately.
 * If a property exists in both objects, the value from `cfg2` will overwrite the value from `cfg1`.
 * Optional chaining is used to safely access nested properties in `cfg2`.
 *
 * @param cfg1 - The first configuration object.
 * @param cfg2 - The second configuration object.
 * @returns A new configuration object that is the result of merging `cfg1` and `cfg2`.
 */
export function mergeConfigs(cfg1: Config, cfg2: DeepPartial<Config>): Config {
	return {
		...cfg1,
		...cfg2,
		stars: {
			...cfg1.stars,
			...cfg2.stars,
		},
		grid: {
			...cfg1.grid,
			...cfg2.grid,
		},
		constellations: {
			boundaries: {
				...cfg1.constellations.boundaries,
				...cfg2.constellations?.boundaries,
			},
			lines: {
				...cfg1.constellations.lines,
				...cfg2.constellations?.lines,
				labels: {
					...cfg1.constellations.lines.labels,
					...cfg2.constellations?.lines?.labels,
				},
			},
		},
		planets: {
			...cfg1.planets,
			...cfg2.planets,
			labels: {
				...cfg1.planets.labels,
				...cfg2.planets?.labels,
			},
		},
		sun: {
			...cfg1.sun,
			...cfg2.sun,
			label: {
				...cfg1.sun.label,
				...cfg2.sun?.label,
			},
		},
		moon: {
			...cfg1.moon,
			...cfg2.moon,
			label: {
				...cfg1.moon.label,
				...cfg2.moon?.label,
			},
		},
	};
}
