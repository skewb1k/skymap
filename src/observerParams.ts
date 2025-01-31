/**
 * Data used to initialize the sky map view.
 */
export type ObserverParams = {
	/** Observer's latitude in degrees. @default 0 */
	latitude: number;
	/** Observer's longitude in degrees. @default 0 */
	longitude: number;
	/** Observer's date and time. @default new Date() */
	datetime: Date;
	/** Field of view (FOV) in degrees. @default 180 */
	fov: number;
};

export const defaultObserverParams: ObserverParams = {
	latitude: 0,
	longitude: 0,
	datetime: new Date(),
	fov: 180,
};
