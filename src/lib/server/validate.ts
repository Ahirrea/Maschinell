// Deterministische Validierung (PRD Abschnitt 5.3): sprachunabhängig,
// nicht dem LLM überlassen. "Maschenzahlen sind heilig" – Zahlen aus dem
// Original dürfen sich beim Übersetzen nie ändern.
//
// Zwei Ebenen:
//   1. Maschenzahl-Invariante pro Reihe: Zahlenfolgen aus Original und
//      deutscher Übersetzung müssen exakt übereinstimmen. Klammer-Tupel für
//      Größen – z. B. "(4, 6, 8)" – bleiben als eine geordnete Gruppe erhalten
//      (nicht flatten), sodass Reihenfolge und Werte exakt verglichen werden.
//   2. Strukturprüfung über die gesamte Anleitung: Klammern paarig,
//      Reihennummern lückenlos.
//
// Abweichungen brechen NICHT ab, sondern werden sichtbar markiert.

import type { Reihe, GepruefteReihe, ReihenPruefung, StrukturPruefung } from '$lib/types';
import { konvertiereEinheiten } from './units';
import type { Einheitenkonvertierung } from '$lib/types';

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
 * Deterministische Strukturprüfung über alle Reihen: Klammern müssen paarig
 * sein und erkannte Reihennummern lückenlos aufsteigen. Best-effort – findet
 * sie keine Reihennummern, gilt die Kontinuität als erfüllt.
 */
export function pruefeStruktur(reihen: Reihe[]): StrukturPruefung {
	const probleme: string[] = [];

	// Klammern paarig (über Original UND Deutsch, jede Reihe für sich).
	let klammernPaarig = true;
	for (const r of reihen) {
		for (const [feld, text] of [
			['Original', r.original],
			['Deutsch', r.deutsch]
		] as const) {
			const auf = (text.match(/\(/g) ?? []).length;
			const zu = (text.match(/\)/g) ?? []).length;
			if (auf !== zu) {
				klammernPaarig = false;
				probleme.push(`Reihe ${r.index} (${feld}): unpaarige Klammern (${auf}× "(", ${zu}× ")").`);
			}
		}
	}

	// Reihennummern aus dem Original am Zeilenanfang lesen (Row/Rnd/Reihe/Runde …).
	const marker = /^\s*(?:row|rnd|round|r|reihe|runde|rd)\.?\s*(\d+)/i;
	const nummern: number[] = [];
	for (const r of reihen) {
		const m = r.original.match(marker);
		if (m) nummern.push(parseInt(m[1], 10));
	}

	let reihenLueckenlos = true;
	for (let i = 1; i < nummern.length; i++) {
		const vorher = nummern[i - 1];
		const jetzt = nummern[i];
		// Erlaubt: gleiche Nummer (Sub-Reihe) oder +1. Alles andere = Lücke/Sprung.
		if (jetzt !== vorher && jetzt !== vorher + 1) {
			reihenLueckenlos = false;
			probleme.push(`Reihennummern springen von ${vorher} auf ${jetzt}.`);
		}
	}

	return { klammernPaarig, reihenLueckenlos, probleme };
}

/**
 * Reichert alle Reihen um Prüfergebnis und einheitenkonvertierte Anzeige an,
 * zählt die Abweichungen und prüft zusätzlich die Gesamtstruktur.
 * Abweichungen brechen NICHT ab, sondern werden sichtbar markiert.
 */
export function validiere(reihen: Reihe[]): {
	reihen: GepruefteReihe[];
	abweichungen: number;
	struktur: StrukturPruefung;
	konvertierungen: Einheitenkonvertierung[];
} {
	let abweichungen = 0;
	const alleKonvertierungen: Einheitenkonvertierung[] = [];

	const geprueft: GepruefteReihe[] = reihen.map((r) => {
		const pruefung = pruefeReihe(r);
		if (!pruefung.ok) abweichungen++;

		// Einheitenkonvertierung NACH der Zahlenprüfung – die validierte Fassung
		// `deutsch` bleibt unberührt; nur die Anzeige bekommt die Umrechnungen.
		const { text, konvertierungen } = konvertiereEinheiten(r.deutsch);
		for (const k of konvertierungen) {
			if (
				!alleKonvertierungen.some(
					(x) => x.original === k.original && x.konvertiert === k.konvertiert
				)
			) {
				alleKonvertierungen.push(k);
			}
		}

		return { ...r, pruefung, deutschAnzeige: text };
	});

	return {
		reihen: geprueft,
		abweichungen,
		struktur: pruefeStruktur(reihen),
		konvertierungen: alleKonvertierungen
	};
}
