/**
 * Params used to define an observer.
 */
export type ObserverParams = {
	/** Observer's latitude in degrees. @default 0 */
	latitude: number;
	/** Observer's longitude in degrees. @default 0 */
	longitude: number;
	/** Observer's date and time. @default new Date() */
	date: Date;
	/** Field of view (FOV) in degrees. @default 180 */
	fov: number;
};

export const defaultObserverParams: ObserverParams = {
	latitude: 0,
	longitude: 0,
	date: new Date(),
	fov: 180,
};
