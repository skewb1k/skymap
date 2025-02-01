import fetchJson from "./helpers/fetchJson";
import type StarsData from "./types/StarsData.type";

// Default URL to your stars.6.json file (you can also store this in your configuration)
const DEFAULT_STARS_DATA_URL = "https://raw.githubusercontent.com/skewb1k/skymap/main/data/stars.6.json";

/**
 * Loads the stars data from a remote JSON file.
 *
 * @param url - Optional URL to override the default stars data path.
 * @returns A promise that resolves with the stars data.
 */
export async function loadStarsData(url: string = DEFAULT_STARS_DATA_URL): Promise<StarsData> {
	return await fetchJson<StarsData>(url);
}
