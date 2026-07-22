// POST /api/translate  { text: string } → UebersetzungsErgebnis
//
// Der komplette Claude-Aufruf, das Glossar-Caching und die deterministische
// Validierung laufen serverseitig – der Browser sieht nie den API-Key.

import { json, error } from '@sveltejs/kit';
import { uebersetze } from '$lib/server/translate';
import { validiere } from '$lib/server/validate';
import type { UebersetzungsErgebnis } from '$lib/types';
import type { RequestHandler } from './$types';

const MAX_LAENGE = 50_000;

export const POST: RequestHandler = async ({ request }) => {
	let body: { text?: unknown };
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

	let roh;
	try {
		roh = await uebersetze(text);
	} catch (e) {
		console.error('Übersetzung fehlgeschlagen:', e);
		throw error(502, 'Übersetzung fehlgeschlagen. Bitte später erneut versuchen.');
	}

	const { reihen, abweichungen } = validiere(roh.reihen);

	const ergebnis: UebersetzungsErgebnis = {
		quelle: roh.quelle,
		legende: roh.legende,
		reihen,
		abweichungen
	};

	return json(ergebnis);
};
