export default function deepProxy<T extends object>(config: T, callback: () => void): T {
	let finished = false;
	// Recursive Proxy handler
	const handler = {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		set: (target: any, prop: string | symbol, value: any): boolean => {
			target[prop] = value;
			if (finished) {
				callback();
			}
			return true;
		},
	};

	const proxyObj = new Proxy(config, handler);

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const f = (obj: any) => {
		if (obj && typeof obj === "object") {
			for (const key of Object.keys(obj)) {
				if (typeof obj[key] === "object") {
					obj[key] = new Proxy(obj[key], handler);
					f(obj[key]);
				}
			}
		}
	};

	f(proxyObj);
	finished = true;
	return proxyObj;
}
