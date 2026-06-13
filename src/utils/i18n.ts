import * as _m from "#/paraglide/messages/_index";
import { baseLocale, getLocale } from "#/paraglide/runtime";

const DYNAMIC_LOCALES = new Set(["zh-CN"]);
const cache = new Map<string, string>();
const pending = new Set<string>();

async function fetchTranslation(text: string, locale: string) {
	try {
		const res = await fetch("/api/translate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text, locale }),
		});
		if (!res.ok) return;
		const data = (await res.json()) as { translated: string };
		cache.set(`${locale}:${text}`, data.translated);
	} catch {}
}

type MessageFn = (...args: any[]) => string;

const m = {} as typeof _m;
for (const key of Object.keys(_m) as Array<keyof typeof _m>) {
	if (typeof _m[key] === "function") {
		const fn = _m[key] as unknown as MessageFn;
		(m as any)[key] = ((...args: any[]) => {
			const locale = getLocale();

			if (locale === baseLocale) return fn(...args);
			if (!DYNAMIC_LOCALES.has(locale)) return fn(...args);

			const [inputs = {}, options = {}] = args;
			const sourceText = fn(inputs, { ...options, locale: baseLocale });

			const cacheKey = `${locale}:${sourceText}`;
			if (cache.has(cacheKey)) return cache.get(cacheKey)!;

			if (!pending.has(cacheKey)) {
				pending.add(cacheKey);
				fetchTranslation(sourceText, locale).finally(() =>
					pending.delete(cacheKey),
				);
			}

			return sourceText;
		}) as MessageFn;
	}
}

export { m };
