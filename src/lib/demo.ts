// Demo-/Vorschaumodus (client-seitig, ohne API).
//
// Ein fest verdrahtetes Beispiel-Ergebnis, mit dem sich die komplette Ausgabe
// (Größen-Hervorhebung, Einheitenanzeige, Struktur-Warnungen, Legende,
// Markdown-Kopieren/-Download) ohne Anthropic-API und ohne die Server-Route
// durchklicken und visuell verifizieren lässt.
//
// Das Beispiel ist BEWUSST so gewählt, dass jeder Ausgabe-Zustand einmal
// vorkommt:
//   • Mehrgrößen-Anleitung (S/M/L) mit gewählter Größe M → Klammer-Tupel-
//     Hervorhebung der mittleren Spalte.
//   • Einheitenkonvertierung (Yards→m, Zoll→cm, Garngewicht) → Einheitenanzeige.
//   • Genau EINE Reihe mit Maschenzahl-Abweichung (Reihe 3: „(29,…)" vs.
//     „(28,…)") → ⚠-Marker + Meta-Warnung.
//   • Eine Lücke in den Reihennummern (4 → 6) → Struktur-Warnung.
//   • Automatische DE-Legende.
//
// WICHTIG: Die abgeleiteten Felder (`pruefung`, `deutschAnzeige`, `struktur`,
// `konvertierungen`, `abweichungen`) sind hier hart hinterlegt, damit der
// Demomodus ohne Server auskommt. `src/lib/demo.test.ts` rechnet sie über die
// echte `validiere()`-Pipeline nach und stellt sicher, dass diese Kopie nie
// unbemerkt von der echten Pipeline abweicht.

import type { Erkennung, GepruefteReihe, LegendenEintrag, Reihe, UebersetzungsErgebnis } from './types';

/** Roh-Eingabe des Beispiels: Original + deutsche Übersetzung pro Reihe. */
export const DEMO_ROHREIHEN: Reihe[] = [
	{
		index: 1,
		original:
			'Material: worsted weight yarn, approx. 220 yards. Hook H (US). Gauge: 14 sts x 16 rows = 4 inches.',
		deutsch:
			'Material: Worsted-Garn, ca. 220 yards. Häkelnadel H (US). Maschenprobe: 14 M x 16 Reihen = 4 inches.',
		maschenzahlen: []
	},
	{
		index: 2,
		original:
			'Row 1 (RS): Ch (31, 37, 43), 1 sc in 2nd ch from hook and in each ch across. (30, 36, 42)',
		deutsch:
			'Reihe 1 (Hinreihe): (31, 37, 43) Lm, 1 fM in die 2. Lm ab Nadel und in jede weitere Lm. (30, 36, 42)',
		maschenzahlen: []
	},
	{
		index: 3,
		original: 'Row 2: Ch 1, turn. Sc in each st across. (30, 36, 42)',
		deutsch: 'Reihe 2: 1 Lm, wenden. fM in jede M. (30, 36, 42)',
		maschenzahlen: []
	},
	{
		index: 4,
		original: 'Row 3: Sc2tog, sc in each st to end. (29, 35, 41)',
		// Bewusste Abweichung: „(28, …)" statt Original „(29, …)" → wird von der
		// deterministischen Maschenzahl-Prüfung markiert.
		deutsch: 'Reihe 3: 2 M zusammen abmaschen, dann fM bis zum Ende. (28, 35, 41)',
		maschenzahlen: []
	},
	{
		index: 5,
		original: 'Row 4: Ch 1, turn. Sc in each st across. (29, 35, 41)',
		deutsch: 'Reihe 4: 1 Lm, wenden. fM in jede M. (29, 35, 41)',
		maschenzahlen: []
	},
	{
		// Sprung von Reihe 4 auf 6 → löst die Struktur-Warnung aus.
		index: 6,
		original: 'Row 6: Fasten off, leaving a 6 inch tail for seaming.',
		deutsch: 'Reihe 6: Faden abschneiden, ca. 6 inches Faden zum Zusammennähen lassen.',
		maschenzahlen: []
	}
];

export const DEMO_ERKENNUNG: Erkennung = {
	sprache: 'Englisch',
	technik: 'Häkeln',
	terminologie: 'US',
	begruendung:
		'„sc" (single crochet) und „gauge" sind eindeutige US-Terminologie; UK würde dieselbe Masche „dc" (double crochet) nennen.',
	groessen: [
		{ index: 0, name: 'S' },
		{ index: 1, name: 'M' },
		{ index: 2, name: 'L' }
	]
};

/** Gewählte Größe: M (mittlere Spalte der Klammer-Tupel). */
export const DEMO_GROESSE_INDEX = 1;

export const DEMO_LEGENDE: LegendenEintrag[] = [
	{ abk: 'Lm', bedeutung: 'Luftmasche' },
	{ abk: 'fM', bedeutung: 'feste Masche (US: single crochet)' },
	{ abk: 'M', bedeutung: 'Masche(n)' }
];

// Abgeleitete Felder pro Reihe (von der echten Pipeline erzeugt, hier fixiert).
// Siehe demo.test.ts – dieser Block wird gegen `validiere()` abgeglichen.
type AbgeleiteteReihe = Pick<GepruefteReihe, 'pruefung' | 'deutschAnzeige'>;
const DEMO_ABGELEITET: Record<number, AbgeleiteteReihe> = {
	1: {
		pruefung: { ok: true, zahlenOriginal: ['220', '14', '16', '4'], zahlenDeutsch: ['220', '14', '16', '4'] },
		deutschAnzeige:
			'Material: Worsted (Worsted / dickes DK–Aran)-Garn, ca. 220 yards (201,2 m). Häkelnadel H (US). Maschenprobe: 14 M x 16 Reihen = 4 inches (10,2 cm).'
	},
	2: {
		pruefung: {
			ok: true,
			zahlenOriginal: ['(31,37,43)', '(30,36,42)', '1', '1', '2'],
			zahlenDeutsch: ['(31,37,43)', '(30,36,42)', '1', '1', '2']
		},
		deutschAnzeige:
			'Reihe 1 (Hinreihe): (31, 37, 43) Lm, 1 fM in die 2. Lm ab Nadel und in jede weitere Lm. (30, 36, 42)'
	},
	3: {
		pruefung: { ok: true, zahlenOriginal: ['(30,36,42)', '2', '1'], zahlenDeutsch: ['(30,36,42)', '2', '1'] },
		deutschAnzeige: 'Reihe 2: 1 Lm, wenden. fM in jede M. (30, 36, 42)'
	},
	4: {
		pruefung: { ok: false, zahlenOriginal: ['(29,35,41)', '3', '2'], zahlenDeutsch: ['(28,35,41)', '3', '2'] },
		deutschAnzeige: 'Reihe 3: 2 M zusammen abmaschen, dann fM bis zum Ende. (28, 35, 41)'
	},
	5: {
		pruefung: { ok: true, zahlenOriginal: ['(29,35,41)', '4', '1'], zahlenDeutsch: ['(29,35,41)', '4', '1'] },
		deutschAnzeige: 'Reihe 4: 1 Lm, wenden. fM in jede M. (29, 35, 41)'
	},
	6: {
		pruefung: { ok: true, zahlenOriginal: ['6', '6'], zahlenDeutsch: ['6', '6'] },
		deutschAnzeige: 'Reihe 6: Faden abschneiden, ca. 6 inches (15,2 cm) Faden zum Zusammennähen lassen.'
	}
};

/** Fertig geprüfte Reihen (Roh-Reihe + abgeleitete Felder). */
export const DEMO_REIHEN: GepruefteReihe[] = DEMO_ROHREIHEN.map((r) => ({
	...r,
	...DEMO_ABGELEITET[r.index]
}));

/**
 * Das fest verdrahtete Beispiel-Ergebnis – identisch zur Struktur, die
 * `/api/translate` liefern würde, nur ohne API-Aufruf.
 */
export const DEMO_ERGEBNIS: UebersetzungsErgebnis = {
	erkennung: DEMO_ERKENNUNG,
	groesseIndex: DEMO_GROESSE_INDEX,
	legende: DEMO_LEGENDE,
	reihen: DEMO_REIHEN,
	struktur: {
		klammernPaarig: true,
		reihenLueckenlos: false,
		probleme: ['Reihennummern springen von 4 auf 6.']
	},
	konvertierungen: [
		{ original: '4 inches', konvertiert: '10,2 cm' },
		{ original: '220 yards', konvertiert: '201,2 m' },
		{ original: 'Worsted', konvertiert: 'Worsted / dickes DK–Aran' },
		{ original: '6 inches', konvertiert: '15,2 cm' }
	],
	abweichungen: 1
};
