class SphericalStarMap {
	constructor(canvas, options = {}) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.latitude = options.latitude || 0;
		this.longitude = options.longitude || 0;
		this.datetime = options.datetime || new Date();
		this.azimuth = options.viewAzimuth || 0; // viewing direction
		this.altitude = options.viewAltitude || 0; // viewing elevation
		this.fov = options.fov || 90; // field of view in degrees

		this.width = canvas.width;
		this.height = canvas.height;
	}

	project(alt, az) {
		// Convert spherical to cartesian
		const altRad = (alt * Math.PI) / 180;
		const azRad = (az * Math.PI) / 180;

		const x = Math.cos(altRad) * Math.sin(azRad);
		const y = Math.cos(altRad) * Math.cos(azRad);
		const z = Math.sin(altRad);

		// Apply viewer rotation
		const viewAltRad = (this.altitude * Math.PI) / 180;
		const viewAzRad = (this.azimuth * Math.PI) / 180;

		const rotX = x;
		const rotY = y * Math.cos(viewAltRad) - z * Math.sin(viewAltRad);
		const rotZ = y * Math.sin(viewAltRad) + z * Math.cos(viewAltRad);

		const finalX = rotX * Math.cos(viewAzRad) - rotY * Math.sin(viewAzRad);
		const finalY = rotX * Math.sin(viewAzRad) + rotY * Math.cos(viewAzRad);
		const finalZ = rotZ;

		// Project to 2D using stereographic projection
		if (finalZ < -0.99) return null; // Behind viewer

		const scale = this.width / (2 * Math.tan((this.fov * Math.PI) / 360));
		const projX = (finalX / (1 + finalZ)) * scale + this.width / 2;
		const projY = (finalY / (1 + finalZ)) * scale + this.height / 2;

		return { x: projX, y: projY, visible: finalZ > -0.99 };
	}

	drawCelestialGrid() {
		// Draw altitude circles
		for (let alt = -80; alt <= 80; alt += 10) {
			this.ctx.beginPath();
			let firstPoint = true;

			for (let az = 0; az <= 360; az += 5) {
				const point = this.project(alt, az);
				if (point?.visible) {
					if (firstPoint) {
						this.ctx.moveTo(point.x, point.y);
						firstPoint = false;
					} else {
						this.ctx.lineTo(point.x, point.y);
					}
				}
			}
			this.ctx.strokeStyle = "#444444";
			this.ctx.stroke();
		}

		// Draw azimuth lines
		for (let az = 0; az < 360; az += 15) {
			this.ctx.beginPath();
			let firstPoint = true;

			for (let alt = -90; alt <= 90; alt += 5) {
				const point = this.project(alt, az);
				if (point?.visible) {
					if (firstPoint) {
						this.ctx.moveTo(point.x, point.y);
						firstPoint = false;
					} else {
						this.ctx.lineTo(point.x, point.y);
					}
				}
			}
			this.ctx.strokeStyle = "#444444";
			this.ctx.stroke();
		}
	}

	plotStar(ra, dec, magnitude) {
		const lst = this.calculateLST();
		const ha = lst - ra;

		// Convert equatorial to horizontal coordinates
		const coords = this.equatorialToHorizontal(ha, dec);
		const point = this.project(coords.alt, coords.az);

		if (point?.visible) {
			const starSize = Math.max(1, (6 - magnitude) * 0.5);
			this.ctx.beginPath();
			this.ctx.arc(point.x, point.y, starSize, 0, 2 * Math.PI);
			this.ctx.fillStyle = "white";
			this.ctx.fill();
		}
	}

	equatorialToHorizontal(ha, dec) {
		const lat = (this.latitude * Math.PI) / 180;
		const haRad = (ha * Math.PI) / 180;
		const decRad = (dec * Math.PI) / 180;

		const sinAlt =
			Math.sin(lat) * Math.sin(decRad) +
			Math.cos(lat) * Math.cos(decRad) * Math.cos(haRad);
		const alt = (Math.asin(sinAlt) * 180) / Math.PI;

		const cosAz =
			(Math.sin(decRad) - Math.sin(lat) * sinAlt) /
			(Math.cos(lat) * Math.cos(Math.asin(sinAlt)));
		const az = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI;

		return { alt, az: Math.sin(haRad) > 0 ? 360 - az : az };
	}

	calculateLST() {
		// Calculate Local Sidereal Time
		const d = new Date(this.datetime);
		const jd = this.julianDate(d);
		const T = (jd - 2451545.0) / 36525;
		const gmst =
			280.46061837 +
			360.98564736629 * (jd - 2451545.0) +
			0.000387933 * T * T -
			(T * T * T) / 38710000;
		return (gmst + this.longitude) % 360;
	}
	julianDate(date) {
		const time = date.getTime();
		return time / 86400000 + 2440587.5;
	}
}
