// POST /api/translate  { text, erkennung, groesseIndex } → UebersetzungsErgebnis
//
// Stufe 2–4: Übersetzung mit bestätigter Erkennung, deterministische
// Maschenzahl-/Strukturvalidierung und Einheitenkonvertierung. Der komplette
// Claude-Aufruf, das Glossar-Caching und die Validierung laufen serverseitig –
// der Browser sieht nie den API-Key.

import { json, error } from '@sveltejs/kit';
import { uebersetze } from '$lib/server/translate';
import { validiere } from '$lib/server/validate';
import type { Erkennung, Technik, Terminologie, UebersetzungsErgebnis } from '$lib/types';
import type { RequestHandler } from './$types';

const MAX_LAENGE = 50_000;

const TECHNIKEN: Technik[] = ['Häkeln', 'Stricken', 'Unbekannt'];
const TERMINOLOGIEN: Terminologie[] = ['US', 'UK', 'unklar', 'n/a'];

/** Validiert und normalisiert die (vom Client bestätigte) Erkennung. */
function parseErkennung(roh: unknown): Erkennung | null {
	if (!roh || typeof roh !== 'object') return null;
	const e = roh as Record<string, unknown>;

	const sprache = typeof e.sprache === 'string' && e.sprache.trim() ? e.sprache.trim() : null;
	const technik = TECHNIKEN.includes(e.technik as Technik) ? (e.technik as Technik) : null;
	const terminologie = TERMINOLOGIEN.includes(e.terminologie as Terminologie)
		? (e.terminologie as Terminologie)
		: null;
	if (!sprache || !technik || !terminologie) return null;

	const groessen = Array.isArray(e.groessen)
		? e.groessen
				.map((g, i) => {
					if (!g || typeof g !== 'object') return null;
					const name = (g as Record<string, unknown>).name;
					return typeof name === 'string' && name.trim()
						? { index: i, name: name.trim() }
						: null;
				})
				.filter((g): g is { index: number; name: string } => g !== null)
		: [];

	const begruendung = typeof e.begruendung === 'string' ? e.begruendung : '';

	return { sprache, technik, terminologie, begruendung, groessen };
}

export const POST: RequestHandler = async ({ request }) => {
	let body: { text?: unknown; erkennung?: unknown; groesseIndex?: unknown };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Ungültiger Request-Body (kein JSON).');
	}

	const text = typeof body.text === 'string' ? body.text.trim() : '';
	if (!text) {
		throw error(400, 'Bitte eine Anleitung eingeben.');
	}
	if (text.length > MAX_LAENGE) {
		throw error(413, `Anleitung ist zu lang (max. ${MAX_LAENGE} Zeichen).`);
	}

	const erkennung = parseErkennung(body.erkennung);
	if (!erkennung) {
		throw error(400, 'Fehlende oder ungültige Erkennung. Bitte zuerst analysieren und bestätigen.');
	}

	// Größenwahl: gültiger Index in die erkannten Größen, sonst null.
	let groesseIndex: number | null = null;
	if (typeof body.groesseIndex === 'number' && Number.isInteger(body.groesseIndex)) {
		if (body.groesseIndex >= 0 && body.groesseIndex < erkennung.groessen.length) {
			groesseIndex = body.groesseIndex;
		}
	}

	let roh;
	try {
		roh = await uebersetze(text, erkennung, groesseIndex);
	} catch (e) {
		console.error('Übersetzung fehlgeschlagen:', e);
		throw error(502, 'Übersetzung fehlgeschlagen. Bitte später erneut versuchen.');
	}

	const { reihen, abweichungen, struktur, konvertierungen } = validiere(roh.reihen);

	const ergebnis: UebersetzungsErgebnis = {
		erkennung,
		groesseIndex,
		legende: roh.legende,
		reihen,
		struktur,
		konvertierungen,
		abweichungen
	};

	return json(ergebnis);
};
