// Rohdaten des kuratierten Glossars – die zentrale Wahrheitsquelle für BEIDE
// Seiten des Prompts (siehe PRD Anhang 11, CLAUDE.md):
//
//   - Ziel-Glossar (de-ziel.ts): erzwingt einheitliche deutsche Abkürzungen.
//   - Quell-Glossare (quell.ts): geben dem Modell die bestätigte EN-US- bzw.
//     EN-UK-Terminologie als Leitplanke.
//
// Beides speist sich aus denselben Zeilen, damit US/UK-Term und deutscher
// Standard nie auseinanderlaufen. Weitere Quellsprachen (NL, DK, FR …) folgen
// in Phase 2.

/** Zeile im Glossar: US-Term, UK-Term, deutscher Standard, Bedeutung. */
export interface GlossarZeile {
	us: string;
	uk: string;
	de: string;
	bedeutung: string;
}

/** Häkeln – US-/UK-Terminologie kollidiert; die Ausgabe ist immer eindeutig DE. */
export const HAEKELN: GlossarZeile[] = [
	{ us: 'ch (chain)', uk: 'ch (chain)', de: 'Lm', bedeutung: 'Luftmasche' },
	{ us: 'sl st (slip stitch)', uk: 'ss (slip stitch)', de: 'Km', bedeutung: 'Kettmasche' },
	{ us: 'sc (single crochet)', uk: 'dc (double crochet)', de: 'fM', bedeutung: 'feste Masche' },
	{
		us: 'hdc (half double crochet)',
		uk: 'htr (half treble)',
		de: 'hStb',
		bedeutung: 'halbes Stäbchen'
	},
	{ us: 'dc (double crochet)', uk: 'tr (treble)', de: 'Stb', bedeutung: 'Stäbchen' },
	{ us: 'tr (treble)', uk: 'dtr (double treble)', de: 'DStb', bedeutung: 'Doppelstäbchen' },
	{ us: 'st(s)', uk: 'st(s)', de: 'M', bedeutung: 'Masche(n)' },
	{ us: 'inc (increase)', uk: 'inc (increase)', de: 'Zun', bedeutung: 'Zunahme (2 M in 1 M)' },
	{ us: 'dec (decrease)', uk: 'dec (decrease)', de: 'Abn', bedeutung: 'Abnahme (2 M zusammen)' },
	{ us: 'rnd (round)', uk: 'rnd (round)', de: 'Rd', bedeutung: 'Runde' },
	{ us: 'row', uk: 'row', de: 'R', bedeutung: 'Reihe' },
	{ us: 'yo (yarn over)', uk: 'yo/yfwd', de: 'U', bedeutung: 'Umschlag' },
	{ us: 'sk (skip)', uk: 'miss', de: 'überg.', bedeutung: 'Masche überspringen' },
	{ us: 'BLO (back loop only)', uk: 'BLO', de: 'hMg', bedeutung: 'hinteres Maschenglied' },
	{ us: 'FLO (front loop only)', uk: 'FLO', de: 'vMg', bedeutung: 'vorderes Maschenglied' }
];

/** Stricken – US/UK weitgehend gleich, aber deutscher Standard erzwungen. */
export const STRICKEN: GlossarZeile[] = [
	{ us: 'k (knit)', uk: 'k (knit)', de: 're', bedeutung: 'rechte Masche' },
	{ us: 'p (purl)', uk: 'p (purl)', de: 'li', bedeutung: 'linke Masche' },
	{ us: 'st(s)', uk: 'st(s)', de: 'M', bedeutung: 'Masche(n)' },
	{ us: 'k2tog', uk: 'k2tog', de: '2 M re zsm', bedeutung: '2 Maschen rechts zusammenstricken' },
	{ us: 'p2tog', uk: 'p2tog', de: '2 M li zsm', bedeutung: '2 Maschen links zusammenstricken' },
	{ us: 'ssk', uk: 'ssk', de: 'überz. Abn', bedeutung: 'überzogene Abnahme' },
	{ us: 'yo (yarn over)', uk: 'yo/yfwd', de: 'U', bedeutung: 'Umschlag' },
	{ us: 'kfb', uk: 'kfb', de: 'Zun re', bedeutung: 'aus 1 M 2 M rechts (Zunahme)' },
	{ us: 'sl (slip)', uk: 'sl (slip)', de: 'abh', bedeutung: 'Masche abheben' },
	{ us: 'RS (right side)', uk: 'RS', de: 'Hin-R', bedeutung: 'Hinreihe / rechte Seite' },
	{ us: 'WS (wrong side)', uk: 'WS', de: 'Rück-R', bedeutung: 'Rückreihe / linke Seite' },
	{ us: 'CO (cast on)', uk: 'CO', de: 'anschl.', bedeutung: 'Maschen anschlagen' },
	{ us: 'BO (bind off)', uk: 'cast off', de: 'abk.', bedeutung: 'Maschen abketten' }
];
