// Serverseitige Erkennungsstufe (Stufe 1 der Pipeline, PRD 5.1).
//
// Klassifiziert VOR der Übersetzung: Quellsprache, Technik (Häkeln/Stricken),
// bei Englisch zwingend US- vs. UK-Terminologie sowie erkannte Größen. Das
// Ergebnis wird dem/der Nutzer:in zur Bestätigung angezeigt und ist
// korrigierbar – dieser Schritt verhindert die schlimmste Fehlerklasse
// (US/UK-Fehlklassifikation).
//
// Bewusst ein eigener, schlanker Aufruf: kleines Schema, kein volles
// Ziel-Glossar. Modell wie in Phase 0 (Opus 4.8).

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import type { Erkennung } from '$lib/types';

const MODELL = 'claude-opus-4-8';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const SCHEMA = {
	type: 'object',
	properties: {
		sprache: { type: 'string', description: 'Erkannte Quellsprache, z. B. "Englisch".' },
		technik: { type: 'string', enum: ['Häkeln', 'Stricken', 'Unbekannt'] },
		terminologie: {
			type: 'string',
			enum: ['US', 'UK', 'unklar', 'n/a'],
			description: 'Bei Englisch "US" oder "UK" (bei Zweifel "unklar"); sonst "n/a".'
		},
		begruendung: {
			type: 'string',
			description: 'Kurze Begründung der US/UK-Einordnung mit konkreten Markern aus dem Text.'
		},
		groessen: {
			type: 'array',
			description:
				'Erkannte Größenvarianten in Reihenfolge der Klammer-Tupel, z. B. ["S","M","L"]. Leer, wenn nur eine Größe.',
			items: { type: 'string' }
		}
	},
	required: ['sprache', 'technik', 'terminologie', 'begruendung', 'groessen'],
	additionalProperties: false
} as const;

const SYSTEM_PROMPT = `Du bist ein Experte für Häkel- und Strickanleitungen. Analysiere den folgenden Anleitungstext und klassifiziere ihn. Du übersetzt NICHT.

Bestimme:
1. Quellsprache (z. B. "Englisch", "Niederländisch").
2. Technik: "Häkeln", "Stricken" oder "Unbekannt".
3. Terminologie – NUR bei Englisch zwingend, sonst "n/a":
   - "single crochet" (sc) existiert NUR in US-Terminologie → starker US-Marker.
   - "double crochet" (dc) als Grundmasche + "treble" (tr) statt "double crochet" für Stäbchen → UK-Marker.
   - "gauge"/"yarn over" (US) vs. "tension"/"yarn forward/yfwd" (UK) sind schwächere Zusatzmarker.
   - Bei echtem Zweifel "unklar" wählen, nicht raten.
4. Größen: Erkenne Mehrgrößen-Anleitungen an Klammer-Tupeln wie "(4, 6, 8)" oder Größenangaben
   wie "S (M, L)". Gib die Größennamen in Reihenfolge zurück (z. B. ["S","M","L"]). Wenn keine
   klaren Namen existieren, nummeriere ("Größe 1", "Größe 2", …). Leere Liste bei nur einer Größe.

Begründe die US/UK-Einordnung knapp mit konkreten Wörtern aus dem Text.`;

/** Klassifiziert eine Anleitung, ohne sie zu übersetzen. */
export async function erkenne(anleitung: string): Promise<Erkennung> {
	const stream = client.messages.stream({
		model: MODELL,
		max_tokens: 4000,
		thinking: { type: 'adaptive' },
		output_config: {
			effort: 'high',
			format: { type: 'json_schema', schema: SCHEMA }
		},
		system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
		messages: [
			{
				role: 'user',
				content: `Analysiere diese Anleitung:\n\n${anleitung}`
			}
		]
	});

	const message = await stream.finalMessage();
	const textBlock = message.content.find((b) => b.type === 'text');
	if (!textBlock || textBlock.type !== 'text') {
		throw new Error('Keine Textantwort vom Modell erhalten.');
	}

	const roh = JSON.parse(textBlock.text) as {
		sprache: string;
		technik: Erkennung['technik'];
		terminologie: Erkennung['terminologie'];
		begruendung: string;
		groessen: string[];
	};

	return {
		sprache: roh.sprache,
		technik: roh.technik,
		terminologie: roh.terminologie,
		begruendung: roh.begruendung,
		groessen: roh.groessen.map((name, index) => ({ index, name }))
	};
}
