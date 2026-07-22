// Serverseitiger Claude-Aufruf (Übersetzungsstufe der Pipeline, Stufe 2).
//
// - Modell: Opus 4.8 (claude-opus-4-8) – Phase 0/1 validieren die Qualität,
//   bevor auf Kosten (Sonnet 5) optimiert wird.
// - Structured Outputs: das Modell liefert Reihen mit Nummer + Maschenzahlen,
//   damit die deterministische Validierung einfach darauf aufsetzt.
// - Prompt Caching: das harte DE-Ziel-Glossar ist ein stabiler, gecachter
//   Prompt-Präfix (~10 % Kosten bei Folgeübersetzungen).
// - Der ANTHROPIC_API_KEY kommt aus $env/static/private und erreicht den
//   Browser nie.
//
// Phase 1: Die Erkennung ist bereits bestätigt (US/UK entschieden) und wird
// dem Modell als Fakt vorgegeben – nicht erneut geraten. Das passende
// Quell-Glossar (EN-US oder EN-UK) kommt als zusätzliche Leitplanke dazu.

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { ZIEL_GLOSSAR_PROMPT } from '$lib/glossary/de-ziel';
import { quellGlossarPrompt } from '$lib/glossary/quell';
import type { Erkennung, Uebersetzung } from '$lib/types';

const MODELL = 'claude-opus-4-8';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// JSON-Schema für die strukturierte Modellausgabe. Bewusst flach und ohne
// nicht unterstützte Constraints (minLength etc.), damit Structured Outputs
// greift. Die Quelle/Erkennung ist bereits bestätigt und wird NICHT mehr vom
// Modell zurückgegeben (kein erneutes US/UK-Raten).
const SCHEMA = {
	type: 'object',
	properties: {
		legende: {
			type: 'array',
			description: 'Nur die tatsächlich verwendeten deutschen Abkürzungen.',
			items: {
				type: 'object',
				properties: {
					abk: { type: 'string' },
					bedeutung: { type: 'string' }
				},
				required: ['abk', 'bedeutung'],
				additionalProperties: false
			}
		},
		reihen: {
			type: 'array',
			description: 'Eine Struktureinheit (Reihe/Runde) pro Eintrag, in Originalreihenfolge.',
			items: {
				type: 'object',
				properties: {
					index: { type: 'integer', description: 'Fortlaufender Reihen-Index ab 1.' },
					original: { type: 'string', description: 'Originaltext dieser Reihe, unverändert.' },
					deutsch: { type: 'string', description: 'Deutsche Übersetzung mit Ziel-Glossar.' },
					maschenzahlen: {
						type: 'array',
						items: { type: 'string' },
						description: 'Zahlen/Klammer-Tupel dieser Reihe in Reihenfolge, z. B. ["(4, 6, 8)"].'
					}
				},
				required: ['index', 'original', 'deutsch', 'maschenzahlen'],
				additionalProperties: false
			}
		}
	},
	required: ['legende', 'reihen'],
	additionalProperties: false
} as const;

/** Baut die bestätigte Erkennung + Größenwahl als Fakt-Vorgabe für das Modell. */
function auftrag(text: string, erkennung: Erkennung, groesseIndex: number | null): string {
	const zeilen: string[] = [
		'Die Erkennung wurde bereits bestätigt – behandle sie als FESTSTEHEND, rate NICHT neu:',
		`- Quellsprache: ${erkennung.sprache}`,
		`- Technik: ${erkennung.technik}`,
		`- Terminologie: ${erkennung.terminologie}`
	];

	const gewaehlt =
		groesseIndex !== null ? erkennung.groessen.find((g) => g.index === groesseIndex) : undefined;
	if (erkennung.groessen.length > 0) {
		const namen = erkennung.groessen.map((g) => g.name).join(', ');
		zeilen.push(`- Größen: ${namen}`);
		if (gewaehlt) {
			zeilen.push(
				`- Gewählte Größe: "${gewaehlt.name}" (Position ${gewaehlt.index + 1} in den Klammer-Tupeln). ` +
					'ALLE Größenwerte bleiben erhalten – ändere/entferne nichts an den Tupeln.'
			);
		}
	}

	return `${zeilen.join('\n')}\n\nÜbersetze die folgende Anleitung nach dem obigen Regelwerk:\n\n${text}`;
}

/**
 * Übersetzt eine Anleitung nach Deutsch und gibt die strukturierte,
 * pro Reihe segmentierte Rohübersetzung zurück (noch ohne Validierung).
 */
export async function uebersetze(
	anleitung: string,
	erkennung: Erkennung,
	groesseIndex: number | null
): Promise<Uebersetzung> {
	const quell = quellGlossarPrompt(erkennung.terminologie);

	// Stabiler Präfix (Ziel-Glossar) zuerst → gecacht. Danach das terminologie-
	// spezifische Quell-Glossar (variiert nur zwischen US/UK/andere).
	const system: Anthropic.MessageCreateParams['system'] = [
		{ type: 'text', text: ZIEL_GLOSSAR_PROMPT, cache_control: { type: 'ephemeral' } }
	];
	if (quell) system.push({ type: 'text', text: quell });

	const stream = client.messages.stream({
		model: MODELL,
		max_tokens: 32000,
		// Adaptive Thinking: das Modell entscheidet selbst über die Tiefe.
		thinking: { type: 'adaptive' },
		output_config: {
			effort: 'high',
			format: { type: 'json_schema', schema: SCHEMA }
		},
		system,
		messages: [{ role: 'user', content: auftrag(anleitung, erkennung, groesseIndex) }]
	});

	const message = await stream.finalMessage();

	// Structured Outputs garantiert einen Text-Block mit gültigem JSON.
	const textBlock = message.content.find((b) => b.type === 'text');
	if (!textBlock || textBlock.type !== 'text') {
		throw new Error('Keine Textantwort vom Modell erhalten.');
	}

	return JSON.parse(textBlock.text) as Uebersetzung;
}
