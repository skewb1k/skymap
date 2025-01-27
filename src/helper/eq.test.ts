import { Angle } from "../Angle";
import AstronomicalTime from "../AstronomicalTime/AstronomicalTime";
import equatorialToHorizontal from "./equatorialToHorizontal";

describe("equatorialToHorizontal", () => {
	test("converts known star position correctly", () => {
		const ra = Angle.fromDegrees(145); // ~145° RA
		const dec = Angle.fromDegrees(23.45); // ~23.45° Dec
		const lat = Angle.fromDegrees(40); // 40° N
		const lon = Angle.fromDegrees(-80); // -80° E (80° W)
		const date = AstronomicalTime.fromUTCDate(new Date("2024-01-15T00:00:00Z"));

		const result = equatorialToHorizontal(ra, dec, lat, lon, date);

		expect(result.alt.degrees).toBeCloseTo(45.0, 1);
		expect(result.az.degrees).toBeCloseTo(180.0, 1);
	});

	// test("handles celestial pole", () => {
	// 	const ra = new Angle(0); // Any RA value
	// 	const dec = new Angle(Math.PI / 2); // 90° Dec (North Celestial Pole)
	// 	const lat = new Angle(0.6981317007977318); // 40° N
	// 	const lon = new Angle(0);
	// 	const date = new AstronomicalTime("2024-01-15T00:00:00Z");

	// 	const result = equatorialToHorizontal(ra, dec, lat, lon, date);

	// 	expect(result.alt.degrees).toBeCloseTo(40.0, 1); // Should equal observer's latitude
	// 	expect(result.az.degrees).toBeCloseTo(0.0, 1);
	// });

	// test("handles object at horizon", () => {
	// 	const ra = new Angle(Math.PI); // 12h RA
	// 	const dec = new Angle(0); // 0° Dec
	// 	const lat = new Angle(0); // Equator
	// 	const lon = new Angle(0);
	// 	const date = new AstronomicalTime("2024-01-15T12:00:00Z");

	// 	const result = equatorialToHorizontal(ra, dec, lat, lon, date);

	// 	expect(result.alt.degrees).toBeCloseTo(0.0, 1);
	// 	expect(result.az.degrees).toBeCloseTo(270.0, 1);
	// });

	// test("handles object below horizon", () => {
	// 	const ra = new Angle(0);
	// 	const dec = new Angle(-Math.PI / 4); // -45° Dec
	// 	const lat = new Angle(Math.PI / 4); // 45° N
	// 	const lon = new Angle(0);
	// 	const date = new AstronomicalTime("2024-01-15T00:00:00Z");

	// 	const result = equatorialToHorizontal(ra, dec, lat, lon, date);

	// 	expect(result.alt.degrees).toBeLessThan(0);
	// });

	// test("handles different time zones", () => {
	// 	const ra = new Angle(Math.PI / 2); // 6h RA
	// 	const dec = new Angle(0);
	// 	const lat = new Angle(0.6981317007977318); // 40° N
	// 	const lon = new Angle(2.0943951023931953); // 120° E

	// 	// Test with two times 12 hours apart
	// 	const date1 = new AstronomicalTime("2024-01-15T00:00:00Z");
	// 	const date2 = new AstronomicalTime("2024-01-15T12:00:00Z");

	// 	const result1 = equatorialToHorizontal(ra, dec, lat, lon, date1);
	// 	const result2 = equatorialToHorizontal(ra, dec, lat, lon, date2);

	// 	// Results should be significantly different due to Earth's rotation
	// 	expect(Math.abs(result1.alt.degrees - result2.alt.degrees)).toBeGreaterThan(
	// 		30,
	// 	);
	// });
});
