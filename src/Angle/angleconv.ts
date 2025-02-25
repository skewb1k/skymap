export function degToRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
	return (rad * 180) / Math.PI;
}

export function radToHours(rad: number): number {
	return (rad * 12) / Math.PI;
}

export function degToHours(deg: number): number {
	return deg / 15;
}

export function hoursToRad(hours: number): number {
	return (hours * Math.PI) / 12;
}

export function normalizeDeg(deg: number): number {
	return deg % 360;
}

export function normalizeRad(ra: number): number {
	return ra % (Math.PI * 2);
}

export function normalizeHours(hours: number): number {
	return hours % 24;
}
