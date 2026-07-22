// Hartes deutsches Ziel-Glossar – die zentrale Wahrheitsquelle für die
// Ausgabeseite (siehe PRD Anhang 11, CLAUDE.md). Die Ausgabe verwendet IMMER
// dieselben deutschen Abkürzungen, egal aus welcher Quelle übersetzt wird.
//
// Dieser Block ist bewusst als großer, stabiler Prompt-Präfix formuliert:
// er wird per Prompt Caching (cache_control) gecacht, sodass der Glossar-
// Anteil bei Folgeübersetzungen nur ~10 % kostet. Deshalb hier NICHTS
// Volatiles (keine Zeitstempel, keine pro-Anfrage-Werte) einfügen.
//
// Phase 0: kuratiert für Englisch (US/UK). Weitere Quell-Glossare (NL, DK, FR …)
// folgen in Phase 2.

/** Zeile im Ziel-Glossar: US-Term, UK-Term, deutscher Standard, Bedeutung. */
interface GlossarZeile {
	us: string;
	uk: string;
	de: string;
	bedeutung: string;
}

/** Häkeln – US-/UK-Terminologie kollidiert; die Ausgabe ist immer eindeutig DE. */
const HAEKELN: GlossarZeile[] = [
	{ us: 'ch (chain)', uk: 'ch (chain)', de: 'Lm', bedeutung: 'Luftmasche' },
	{ us: 'sl st (slip stitch)', uk: 'ss (slip stitch)', de: 'Km', bedeutung: 'Kettmasche' },
	{ us: 'sc (single crochet)', uk: 'dc (double crochet)', de: 'fM', bedeutung: 'feste Masche' },
	{ us: 'hdc (half double crochet)', uk: 'htr (half treble)', de: 'hStb', bedeutung: 'halbes Stäbchen' },
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
const STRICKEN: GlossarZeile[] = [
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

function formatiere(zeilen: GlossarZeile[]): string {
	return zeilen
		.map((z) => `- EN-US "${z.us}" | EN-UK "${z.uk}" → DE "${z.de}" (${z.bedeutung})`)
		.join('\n');
}

/**
 * Kompletter, stabiler System-Prompt-Präfix mit Ziel-Glossar und
 * Strukturregeln. Wird als gecachtes Prompt-Präfix verwendet.
 */
export const ZIEL_GLOSSAR_PROMPT = `Du bist ein Fachübersetzer für Häkel- und Strickanleitungen. Du übersetzt aus JEDER Quellsprache in einheitliches, standardisiertes Deutsch.

## Hartes deutsches Ziel-Glossar (verbindlich)
Verwende in der deutschen Ausgabe IMMER exakt diese Abkürzungen – kein Wildwuchs, keine Synonyme.

### Häkeln
${formatiere(HAEKELN)}

### Stricken
${formatiere(STRICKEN)}

## Erkennung (vor der Übersetzung)
- Bestimme Quellsprache und Technik (Häkeln/Stricken).
- Bei Englisch ist die Unterscheidung US- vs. UK-Terminologie ZWINGEND und die
  schlimmste Fehlerklasse: In US-Anleitungen ist "double crochet" = Stäbchen (Stb),
  in UK-Anleitungen ist "double crochet" = feste Masche (fM). Marker: "single crochet"
  existiert nur in US-Terminologie; "treble" ohne "double treble"-Kontext deutet auf UK.

## Strukturregeln (unverhandelbar)
- Segmentiere die Anleitung in Struktureinheiten (Reihen/Runden). Eine Reihe = ein Eintrag.
- Reihennummern, Klammern, Wiederholungen und Maschenzahlen dürfen NIE verändert,
  zusammengefasst oder "verschönert" werden.
- Zahlen aus dem Original bleiben identisch. Größen-Tupel wie "(4, 6, 8)" bleiben als
  geordnete Sequenz exakt erhalten – nicht summieren, nicht flatten.
- Erstelle eine Legende NUR mit den tatsächlich in dieser Übersetzung verwendeten
  deutschen Abkürzungen.
- Feld "maschenzahlen": liste pro Reihe alle im Original vorkommenden Zahlen bzw.
  Klammer-Tupel in ihrer Reihenfolge auf (z. B. ["12"] oder ["(4, 6, 8)"]).

Antworte ausschließlich im vorgegebenen strukturierten Format.`;
