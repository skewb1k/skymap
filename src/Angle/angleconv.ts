import memoize from "../shared/memoize";

export const degToRad = memoize((deg: number): number => {
	return (deg * Math.PI) / 180;
});

export const radToDeg = memoize((rad: number): number => {
	return (rad * 180) / Math.PI;
});

export const radToHours = memoize((rad: number): number => {
	return (rad * 12) / Math.PI;
});

export const degToHours = memoize((deg: number): number => {
	return deg / 15;
});

export const hoursToRad = memoize((hours: number): number => {
	return (hours * Math.PI) / 12;
});

export const normalizeDeg = (deg: number): number => {
	return deg % 360;
};

export const normalizeRad = (ra: number): number => {
	return ra % (Math.PI * 2);
};

export const normalizeHours = (hours: number): number => {
	return hours % 24;
};
