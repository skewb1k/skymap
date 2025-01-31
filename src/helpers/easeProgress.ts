/**
 * Eases a linear progress value to create smoother animations.
 *
 * @param progress - The current linear progress (between 0 and 1).
 * @returns The eased progress value.
 */
export default function easeProgress(progress: number): number {
	return progress < 0.5 ? 2 * progress ** 2 : 1 - (-2 * progress + 2) ** 2 / 2;
}
