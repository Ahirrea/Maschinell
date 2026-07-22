// Serverseitiger Claude-Aufruf (Übersetzungsstufe der Pipeline).
//
// - Modell: Opus 4.8 (claude-opus-4-8) – Phase 0 validiert die Qualität,
//   bevor auf Kosten (Sonnet 5) optimiert wird.
// - Structured Outputs: das Modell liefert Reihen mit Nummer + Maschenzahlen,
//   damit die deterministische Validierung einfach darauf aufsetzt.
// - Prompt Caching: das harte DE-Ziel-Glossar ist ein stabiler, gecachter
//   Prompt-Präfix (~10 % Kosten bei Folgeübersetzungen).
// - Der ANTHROPIC_API_KEY kommt aus $env/static/private und erreicht den
//   Browser nie.

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { ZIEL_GLOSSAR_PROMPT } from '$lib/glossary/de-ziel';
import type { Uebersetzung } from '$lib/types';

const MODELL = 'claude-opus-4-8';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// JSON-Schema für die strukturierte Modellausgabe. Bewusst flach und ohne
// nicht unterstützte Constraints (minLength etc.), damit Structured Outputs
// greift.
const SCHEMA = {
	type: 'object',
	properties: {
		quelle: {
			type: 'object',
			properties: {
				sprache: { type: 'string', description: 'Erkannte Quellsprache, z. B. "Englisch"' },
				technik: { type: 'string', enum: ['Häkeln', 'Stricken', 'Unbekannt'] },
				terminologie: {
					type: 'string',
					description: 'Bei Englisch "US" oder "UK", sonst "n/a"'
				}
			},
			required: ['sprache', 'technik', 'terminologie'],
			additionalProperties: false
		},
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
	required: ['quelle', 'legende', 'reihen'],
	additionalProperties: false
} as const;

/**
 * Übersetzt eine Anleitung nach Deutsch und gibt die strukturierte,
 * pro Reihe segmentierte Rohübersetzung zurück (noch ohne Validierung).
 */
export async function uebersetze(anleitung: string): Promise<Uebersetzung> {
	const stream = client.messages.stream({
		model: MODELL,
		max_tokens: 32000,
		// Adaptive Thinking: das Modell entscheidet selbst über die Tiefe.
		thinking: { type: 'adaptive' },
		output_config: {
			effort: 'high',
			format: { type: 'json_schema', schema: SCHEMA }
		},
		// Stabiler Präfix zuerst → gecacht. Danach die volatile Anleitung.
		system: [
			{
				type: 'text',
				text: ZIEL_GLOSSAR_PROMPT,
				cache_control: { type: 'ephemeral' }
			}
		],
		messages: [
			{
				role: 'user',
				content: `Übersetze die folgende Anleitung nach dem obigen Regelwerk:\n\n${anleitung}`
			}
		]
	});

	const message = await stream.finalMessage();

	// Structured Outputs garantiert einen Text-Block mit gültigem JSON.
	const textBlock = message.content.find((b) => b.type === 'text');
	if (!textBlock || textBlock.type !== 'text') {
		throw new Error('Keine Textantwort vom Modell erhalten.');
	}

	return JSON.parse(textBlock.text) as Uebersetzung;
}
