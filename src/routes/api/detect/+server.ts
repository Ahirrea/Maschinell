// POST /api/detect  { text: string } → Erkennung
//
// Stufe 1 der Pipeline: klassifiziert Sprache/Technik/US-UK/Größen VOR der
// Übersetzung. Das Ergebnis geht in den Bestätigungsdialog; erst der
// bestätigte Wert steuert dann /api/translate.

import { json, error } from '@sveltejs/kit';
import { erkenne } from '$lib/server/detect';
import type { Erkennung } from '$lib/types';
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

	let erkennung: Erkennung;
	try {
		erkennung = await erkenne(text);
	} catch (e) {
		console.error('Erkennung fehlgeschlagen:', e);
		throw error(502, 'Erkennung fehlgeschlagen. Bitte später erneut versuchen.');
	}

	return json(erkennung);
};
