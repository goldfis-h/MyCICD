import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { AddToCartButton } from "#/components/shop/add-to-cart-button";
import { Money } from "#/components/shop/money";
import { ShopImage } from "#/components/shop/shop-image";
import {
	defaultSelectedOptions,
	findVariant,
	VariantSelector,
} from "#/components/shop/variant-selector";
import { getProduct } from "#/server/shopify/catalog.functions";

export const Route = createFileRoute("/shop/products/$handle")({
	loader: async ({ params }) => {
		const product = await getProduct({ data: { handle: params.handle } });
		if (!product) throw notFound();
		return { product };
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{ title: loaderData.product.seo.title ?? loaderData.product.title },
					loaderData.product.seo.description
						? {
								name: "description",
								content: loaderData.product.seo.description,
							}
						: { name: "description", content: "" },
				]
			: [],
	}),
	component: ProductDetailRoute,
});

function ProductDetailRoute() {
	const { product } = Route.useLoaderData();
	const [selected, setSelected] = useState(() =>
		defaultSelectedOptions(product),
	);
	const [translating, setTranslating] = useState(false);
	const [showChinese, setShowChinese] = useState(false);
	const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
	const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
	const variant = findVariant(product.variants.nodes, selected);
	const heroImage = variant?.image ?? product.images.nodes[0] ?? null;

	async function handleTranslate() {
		if (showChinese) {
			setShowChinese(false);
			return;
		}
		setTranslating(true);
		try {
			const [titleRes, descRes] = await Promise.all([
				fetch("/api/translate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text: product.title, locale: "zh-CN" }),
				}),
				fetch("/api/translate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						text: product.descriptionHtml.replace(/<[^>]*>/g, ""),
						locale: "zh-CN",
					}),
				}),
			]);
			const [titleData, descData] = await Promise.all([
				titleRes.json(),
				descRes.json(),
			]);
			setTranslatedTitle(titleData.translated);
			setTranslatedDesc(descData.translated);
			setShowChinese(true);
		} catch {}
		setTranslating(false);
	}

	return (
		<article className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
			<div className="flex flex-col gap-3">
				{heroImage && (
					<ShopImage
						src={heroImage.url}
						alt={heroImage.altText ?? product.title}
						width={1000}
						height={1250}
						loading="eager"
						sizes="(min-width: 1024px) 50vw, 100vw"
						className="w-full rounded-lg object-cover"
					/>
				)}
				{product.images.nodes.length > 1 && (
					<div className="grid grid-cols-4 gap-2">
						{product.images.nodes.slice(0, 8).map((img) => (
							<ShopImage
								key={img.url}
								src={img.url}
								alt={img.altText ?? product.title}
								width={250}
								height={300}
								className="w-full rounded-md object-cover"
							/>
						))}
					</div>
				)}
			</div>

			<div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
				<div className="space-y-2">
					<div className="flex items-start justify-between gap-4">
						<h1 className="text-3xl font-medium tracking-tight">
							{showChinese && translatedTitle ? translatedTitle : product.title}
						</h1>
						<button
							onClick={handleTranslate}
							disabled={translating}
							className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-gray-400"
						>
							{translating ? "翻译中..." : showChinese ? "EN" : "中文"}
						</button>
					</div>
					{variant && (
						<p className="text-2xl">
							<Money
								amount={variant.price.amount}
								currencyCode={variant.price.currencyCode}
							/>
						</p>
					)}
				</div>

				<VariantSelector
					product={product}
					selectedOptions={selected}
					onChange={setSelected}
				/>

				<AddToCartButton product={product} variant={variant} />

				{product.descriptionHtml && !(showChinese && translatedDesc) && (
					<div
						className="shop-prose mt-2 text-sm"
						dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
					/>
				)}
				{showChinese && translatedDesc && (
					<div className="shop-prose mt-2 whitespace-pre-wrap text-sm">
						{translatedDesc}
					</div>
				)}
			</div>
		</article>
	);
}
