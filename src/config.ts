import type DeepPartial from "./helpers/DeepPartial";

/**
 * Configuration options for the skymap.
 */
export type Config = {
	stars: {
		/** Whether stars are displayed. @default true */
		enabled: boolean;
		/** The color of the stars. If undefined, a default will be used. @default undefined */
		color: string | undefined;
		/** A multiplier to scale default star's size. @default 1 */
		scale: number;
	};
	grid: {
		/** Whether the grid is enabled. @default true */
		enabled: boolean;
		/** The color of the grid lines. @default "#555" */
		color: string;
		/** The width of the grid lines. @default 1 */
		width: number;
	};
	constellations: {
		lines: {
			/** Whether constellation lines are displayed. @default true */
			enabled: boolean;
			/** The color of the constellation lines. @default "#eaeaea" */
			color: string;
			/** The width of the constellation lines. @default 2 */
			width: number;
			labels: {
				/** Whether labels are displayed on the constellation lines. @default true */
				enabled: boolean;
				/** The font size of the labels. @default 10 */
				fontSize: number;
				/** The color of the labels. @default "#fefefe" */
				color: string;
			};
		};
		boundaries: {
			/** Whether constellation boundaries are displayed. @default false */
			enabled: boolean;
			/** The color of the boundaries. @default "#aaa" */
			color: string;
			/** The width of the boundaries. @default 1 */
			width: number;
		};
	};
	planets: {
		/** Whether planets are displayed. @default true */
		enabled: boolean;
		/** A multiplier to scale default planet's size. @default 1 */
		scale: number;
		/** The color of the planets. If undefined, a planet's color will be used. @default undefined */
		color: string | undefined;
		/** Labels for planets. */
		labels: {
			/** Whether planet labels are displayed. @default true */
			enabled: boolean;
			/** The font size in px of the planet's labels. @default 12 */
			fontSize: number;
			/** The color of the labels. @default "#fefefe" */
			color: string;
		};
	};
	sun: {
		/** Whether the sun is displayed. @default true */
		enabled: boolean;
		/** A multiplier to scale default sun size. @default 1 */
		scale: number;
		/** The color of the sun. @default "#ffe484" */
		color: string;
		/** Sun label configuration. */
		label: {
			/** Whether the sun label is displayed. @default true */
			enabled: boolean;
			/** The font size in px of the sun label. @default 16 */
			fontSize: number;
			/** The color of the sun label. @default "#fefefe" */
			color: string;
		};
	};
	moon: {
		/** Whether the moon is displayed. @default true */
		enabled: boolean;
		/** A multiplier to scale default moon size. @default 1 */
		scale: number;
		/** The color of the moon. @default "#eaeaea" */
		color: string;
		/** Moon label configuration. */
		label: {
			/** Whether the moon label is displayed. @default true */
			enabled: boolean;
			/** The font size in px of the moon label. @default 10 */
			fontSize: number;
			/** The color of the moon label. @default "#fefefe" */
			color: string;
		};
	};
	/** The background color of the skymap. @default "#000000" */
	bgColor: string;
	/**
	 * The font family used in the skymap. This should be a valid font name that is
	 * installed on the page and available in the CSS. For example, "Arial", "Helvetica",
	 * or any custom font loaded via `@font-face`. Ensure the specified font is accessible
	 * in the browser to avoid fallback to a default font.
	 * @default "Arial"
	 */
	fontFamily: string;
	/**
	 * The language used for labels.
	 * Available languages by default:
	 * - "en": English
	 * - "la": Latin
	 * - "ar": Arabic
	 * - "zh": Chinese
	 * - "fr": French
	 * - "de": German
	 * - "el": Greek
	 * - "he": Hebrew
	 * - "hi": Hindi
	 * - "it": Italian
	 * - "ja": Japanese
	 * - "ru": Russian
	 * - "es": Spanish
	 * - "ko": Korean
	 * - "fa": Persian
	 * - "sym": Symbol (☾)
	 * @default "en"
	 */
	language: string;
	/** Toggle glow effect for stars and constellations.
	 * Can cause performance issues.
	 *@default false */
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
		scale: 1,
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
				fontSize: 10,
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
		scale: 1,
		color: "#eaeaea",
		label: {
			enabled: true,
			fontSize: 10,
			color: "#fefefe",
		},
	},
	sun: {
		enabled: true,
		scale: 1,
		color: "#ffe484",
		label: {
			enabled: true,
			fontSize: 16,
			color: "#fefefe",
		},
	},
	planets: {
		enabled: true,
		scale: 1,
		color: undefined,
		labels: {
			enabled: true,
			fontSize: 12,
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
