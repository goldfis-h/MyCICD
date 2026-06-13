import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as paraglide from "#/paraglide/messages/_index";

export const Route = createFileRoute("/demo/translate")({
	component: TranslateDemo,
});

const MESSAGES: { key: string; text: string }[] = [
	{ key: "home_page", text: paraglide.home_page() },
	{ key: "about_page", text: paraglide.about_page() },
	{ key: "example_message", text: paraglide.example_message() },
	{ key: "language_label", text: paraglide.language_label() },
	{ key: "learn_router", text: paraglide.learn_router() },
];

function TranslateDemo() {
	const [translations, setTranslations] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	async function handleTranslate() {
		setLoading(true);
		const results: Record<string, string> = {};

		for (const msg of MESSAGES) {
			try {
				const res = await fetch("/api/translate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text: msg.text, locale: "zh-CN" }),
				});
				const data = await res.json();
				results[msg.key] = data.translated;
			} catch {
				results[msg.key] = "(translation failed)";
			}
		}

		setTranslations(results);
		setLoading(false);
	}

	return (
		<main
			className="demo-page"
			style={{ padding: "2rem", maxWidth: "640px", margin: "0 auto" }}
		>
			<h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
				Dynamic Translation Demo
			</h1>

			<p style={{ marginBottom: "1.5rem", color: "#666" }}>
				This page demonstrates calling DeepSeek API to translate messages
				dynamically.
			</p>

			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
						<th style={{ padding: "0.5rem" }}>Key</th>
						<th style={{ padding: "0.5rem" }}>English</th>
						<th style={{ padding: "0.5rem" }}>中文</th>
					</tr>
				</thead>
				<tbody>
					{MESSAGES.map((msg) => (
						<tr key={msg.key} style={{ borderBottom: "1px solid #eee" }}>
							<td
								style={{
									padding: "0.5rem",
									fontFamily: "monospace",
									fontSize: "0.875rem",
								}}
							>
								{msg.key}
							</td>
							<td style={{ padding: "0.5rem" }}>{msg.text}</td>
							<td style={{ padding: "0.5rem" }}>
								{translations[msg.key] ? (
									<span style={{ color: "#059669" }}>
										{translations[msg.key]}
									</span>
								) : (
									<span style={{ color: "#999" }}>—</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<button
				onClick={handleTranslate}
				disabled={loading}
				style={{
					marginTop: "1.5rem",
					padding: "0.75rem 1.5rem",
					fontSize: "1rem",
					fontWeight: 600,
					color: "#fff",
					background: loading ? "#999" : "#2563eb",
					border: "none",
					borderRadius: "8px",
					cursor: loading ? "not-allowed" : "pointer",
				}}
			>
				{loading ? "Translating..." : "Translate to Chinese"}
			</button>

			{Object.keys(translations).length > 0 && (
				<div
					style={{
						marginTop: "1rem",
						padding: "0.75rem",
						background: "#f0fdf4",
						borderRadius: "8px",
						fontSize: "0.875rem",
						color: "#166534",
					}}
				>
					✓ {Object.keys(translations).length} messages translated. Results are
					cached in memory. Click again to return cached results immediately.
				</div>
			)}
		</main>
	);
}
