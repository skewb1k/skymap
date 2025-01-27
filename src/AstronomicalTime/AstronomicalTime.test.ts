import { Angle } from "../Angle";
import AstronomicalTime from "./AstronomicalTime";

describe("JulianDate", () => {
	test("calculates Julian Date for January 1, 2000 12:00:00 UTC", () => {
		const at = AstronomicalTime.fromUTCDate(new Date("2000-01-01T12:00:00Z"));
		const jd = at.julianDate;
		expect(jd).toBeCloseTo(2451545.0, 6);
	});

	test("calculates Julian Date for epoch J2000.0 (January 1, 2000 12:00:00 TT)", () => {
		const at = AstronomicalTime.fromUTCDate(
			new Date("2000-01-01T11:58:55.816Z"),
		);
		const jd = at.julianDate;
		expect(jd).toBeCloseTo(2451544.999248, 6);
	});

	test("calculates Julian Date for January 1, 2024 00:00:00 UTC", () => {
		const at = AstronomicalTime.fromUTCDate(new Date("2024-01-01T00:00:00Z"));
		const jd = at.julianDate;
		expect(jd).toBeCloseTo(2460310.5, 6);
	});

	test("handles dates before March 1st (testing January and February adjustment)", () => {
		const at = AstronomicalTime.fromUTCDate(new Date("2024-02-15T00:00:00Z"));
		const jd = at.julianDate;
		expect(jd).toBeCloseTo(2460355.5, 6);
	});

	test("handles dates with fractional components", () => {
		const at = AstronomicalTime.fromUTCDate(new Date("2024-01-01T06:30:45Z"));
		const jd = at.julianDate;
		expect(jd).toBeCloseTo(2460310.771354167, 6);
	});

	test("calculates Julian Date for a historical date (July 4, 1776 12:00:00)", () => {
		const at = AstronomicalTime.fromUTCDate(new Date("1776-07-04T12:00:00Z"));
		const jd = at.julianDate;
		expect(jd).toBeCloseTo(2369916.0, 6);
	});

	test("calculates Julian Date for a some random date (2013-08-20 08:14:00)", () => {
		const at = AstronomicalTime.fromUTCDate(new Date("2013-08-20T08:14:00Z"));
		const jd = at.julianDate;
		expect(jd).toBeCloseTo(2456524.843056, 6);
	});
});

describe("Greenwich Sidereal Time (GST) calculations", () => {
	test("GST calculation for J2000.0 epoch", () => {
		const time = AstronomicalTime.fromUTCDate(new Date("2000-01-01T12:00:00Z"));
		expect(time.GST.hours).toBeCloseTo(18.697374558, 6);
	});

	test("GST calculation for known date 2000-01-01 12:00:00 UTC", () => {
		const time = AstronomicalTime.fromUTCDate(new Date("2000-01-01T12:00:00Z"));
		expect(time.GST.hours).toBeCloseTo(18.697374558, 6);
	});

	test("GST calculation for 2024-01-15 00:00:00 UTC", () => {
		const time = AstronomicalTime.fromUTCDate(new Date("2024-01-15T00:00:00Z"));
		expect(time.GST.hours).toBeCloseTo(7.596778047550469, 3);
	});

	test("GST stays within 0-24 hour range", () => {
		const testDates = [
			new Date("2023-12-31T12:00:00Z"),
			new Date("2024-01-01T12:00:00Z"),
			new Date("2024-01-02T12:00:00Z"),
		];

		testDates.forEach((jd) => {
			const time = AstronomicalTime.fromUTCDate(jd);
			const gst = time.GST.hours;
			expect(gst).toBeGreaterThanOrEqual(0);
			expect(gst).toBeLessThan(24);
		});
	});

	test("GST changes correctly over 24-hour period", () => {
		const baseDate = new Date("2024-01-01T12:00:00Z");
		const time1 = AstronomicalTime.fromUTCDate(baseDate);
		const time2 = AstronomicalTime.fromUTCDate(
			new Date(baseDate.getTime() + 24 * 60 * 60 * 1000),
		);

		// GST advances by ~24.0657 hours in one solar day
		const expectedDiff = time2.GST.subtract(time1.GST).normalize().hours;
		expect(expectedDiff).toBeCloseTo(0.0657, 3);
	});
});

describe("AstronomicalTime LST calculations", () => {
	test("calculates LST correctly for positive longitude", () => {
		// 2024-01-01 00:00:00 UTC
		const time = AstronomicalTime.fromUTCDate(new Date("2024-01-01T00:00:00Z"));
		const longitude = Angle.fromDegrees(45); // 45° East
		const lst = time.LST(longitude);

		// LST should be GST + longitude
		const expectedLST = time.GST.add(longitude).normalize();
		expect(lst.degrees).toBeCloseTo(expectedLST.degrees, 6);
	});

	test("calculates LST correctly for negative longitude", () => {
		// 2024-01-01 00:00:00 UTC
		const time = AstronomicalTime.fromUTCDate(new Date("2024-01-01T00:00:00Z"));
		const longitude = Angle.fromDegrees(-75); // 75° West
		const lst = time.LST(longitude);

		// LST should be GST + longitude
		const expectedLST = time.GST.add(longitude).normalize();
		expect(lst.degrees).toBeCloseTo(expectedLST.degrees, 6);
	});

	test("normalizes LST to 0-360 range", () => {
		const time = AstronomicalTime.fromUTCDate(new Date("2024-01-01T00:00:00Z"));
		const longitude = Angle.fromDegrees(355); // Near the 360° boundary
		const lst = time.LST(longitude);

		expect(lst.degrees).toBeGreaterThanOrEqual(0);
		expect(lst.degrees).toBeLessThan(360);
	});

	test("LST calculation for Greenwich (0° longitude)", () => {
		const time = AstronomicalTime.fromUTCDate(new Date("2024-01-01T00:00:00Z"));
		const longitude = Angle.fromDegrees(0);
		const lst = time.LST(longitude);

		// At Greenwich, LST should equal GST
		expect(lst.degrees).toBeCloseTo(time.GST.degrees, 6);
	});
});
