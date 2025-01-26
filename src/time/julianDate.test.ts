import julianDate from "./julianDate";

describe("julianDate", () => {
	test("calculates Julian Date for January 1, 2000 12:00:00 UTC", () => {
		const date = new Date("2000-01-01T12:00:00Z");
		const jd = julianDate(date);
		expect(jd).toBeCloseTo(2451545.0, 6);
	});

	test("calculates Julian Date for epoch J2000.0 (January 1, 2000 12:00:00 TT)", () => {
		const date = new Date("2000-01-01T11:58:55.816Z");
		const jd = julianDate(date);
		expect(jd).toBeCloseTo(2451544.999248, 6);
	});

	test("calculates Julian Date for January 1, 2024 00:00:00 UTC", () => {
		const date = new Date("2024-01-01T00:00:00Z");
		const jd = julianDate(date);
		expect(jd).toBeCloseTo(2460310.5, 6);
	});

	test("handles dates before March 1st (testing January and February adjustment)", () => {
		const date = new Date("2024-02-15T00:00:00Z");
		const jd = julianDate(date);
		expect(jd).toBeCloseTo(2460355.5, 6);
	});

	test("handles dates with fractional components", () => {
		const date = new Date("2024-01-01T06:30:45Z");
		const jd = julianDate(date);
		expect(jd).toBeCloseTo(2460310.771354167, 6);
	});

	test("calculates Julian Date for a historical date (July 4, 1776 12:00:00)", () => {
		const date = new Date("1776-07-04T12:00:00Z");
		const jd = julianDate(date);
		expect(jd).toBeCloseTo(2369916.0, 6);
	});
});
