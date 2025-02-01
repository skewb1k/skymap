/**
 * Fetches JSON data from a given URL and returns it typed as T.
 *
 * @param url - The URL from which to fetch JSON data.
 * @returns A promise that resolves with the parsed JSON data.
 * @throws An error if the fetch operation fails.
 */
export default async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to load data from ${url}: ${response.statusText}`);
	}
	const data = (await response.json()) as T;
	return data;
}
