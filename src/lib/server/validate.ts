// Deterministische Validierung (PRD Abschnitt 5.3): sprachunabhängig,
// nicht dem LLM überlassen. "Maschenzahlen sind heilig" – Zahlen aus dem
// Original dürfen sich beim Übersetzen nie ändern.
//
// Phase 0 hält das bewusst schlicht: pro Reihe werden die Zahlenfolgen aus
// Original und deutscher Übersetzung extrahiert und auf exakte Gleichheit
// geprüft. Klammer-Tupel für Größen – z. B. "(4, 6, 8)" – werden als eine
// geordnete Gruppe erhalten (nicht flatten), sodass Reihenfolge und Werte
// exakt verglichen werden.

import type { Reihe, GepruefteReihe, ReihenPruefung } from '$lib/types';

/**
 * Extrahiert Zahlenfolgen aus einem Text unter Erhalt der Klammer-Gruppierung.
 * Ein Klammer-Tupel wie "(4, 6, 8)" wird zu einem Token "(4,6,8)"
 * normalisiert; freistehende Zahlen werden einzeln erfasst.
 */
export function extrahiereZahlen(text: string): string[] {
	const tokens: string[] = [];
	// Zuerst Klammer-Tupel mit mindestens einer Zahl als Ganzes erfassen.
	const ohneKlammern = text.replace(/\(([^()]*\d[^()]*)\)/g, (_, inhalt: string) => {
		const zahlen = inhalt.match(/\d+(?:[.,]\d+)?/g);
		if (zahlen && zahlen.length > 0) {
			tokens.push(`(${zahlen.join(',')})`);
			return ' '; // Platzhalter, damit die Zahlen nicht doppelt gezählt werden
		}
		return `(${inhalt})`;
	});
	// Danach alle verbleibenden freistehenden Zahlen.
	const rest = ohneKlammern.match(/\d+(?:[.,]\d+)?/g);
	if (rest) tokens.push(...rest);
	return tokens;
}

/** Prüft eine einzelne Reihe auf Zahlengleichheit zwischen Original und DE. */
export function pruefeReihe(reihe: Reihe): ReihenPruefung {
	const zahlenOriginal = extrahiereZahlen(reihe.original);
	const zahlenDeutsch = extrahiereZahlen(reihe.deutsch);
	const ok =
		zahlenOriginal.length === zahlenDeutsch.length &&
		zahlenOriginal.every((z, i) => z === zahlenDeutsch[i]);
	return { ok, zahlenOriginal, zahlenDeutsch };
}

/**
 * Reichert alle Reihen um ihr Prüfergebnis an und zählt die Abweichungen.
 * Abweichungen brechen NICHT ab, sondern werden sichtbar markiert.
 */
export function validiere(reihen: Reihe[]): { reihen: GepruefteReihe[]; abweichungen: number } {
	let abweichungen = 0;
	const geprueft = reihen.map((r) => {
		const pruefung = pruefeReihe(r);
		if (!pruefung.ok) abweichungen++;
		return { ...r, pruefung };
	});
	return { reihen: geprueft, abweichungen };
}
