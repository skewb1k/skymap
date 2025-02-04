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

export function validateLatitude(value: number): boolean {
	return value >= -90 && value <= 90;
}

export function validateLongitude(value: number): boolean {
	return value >= -180 && value <= 180;
}

export function validateFov(value: number): boolean {
	return value >= 0 && value <= 360;
}

export function validateObserverParams(params: ObserverParams): boolean {
	return validateLatitude(params.latitude) && validateLongitude(params.longitude) && validateFov(params.fov);
}
