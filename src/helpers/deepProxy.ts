export default function deepProxy<T extends object>(config: T, callback: () => void): T {
	let finished = false;
	const handler = {
		// biome-ignore lint/suspicious/noExplicitAny: any
		set: (target: any, prop: string | symbol, value: unknown): boolean => {
			target[prop] = value;
			if (finished) {
				callback();
			}
			return true;
		},
	};

	const proxyObj = new Proxy(config, handler);

	// biome-ignore lint/suspicious/noExplicitAny: any
	const wrap = (obj: any) => {
		if (obj && typeof obj === "object") {
			for (const key of Object.keys(obj)) {
				if (typeof obj[key] === "object") {
					obj[key] = new Proxy(obj[key], handler);
					wrap(obj[key]);
				}
			}
		}
	};

	wrap(proxyObj);
	finished = true;
	return proxyObj;
}
