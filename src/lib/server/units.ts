// Deterministische Einheitenkonvertierung (Stufe 4 der Pipeline, PRD 5.4).
//
// WICHTIG (PRD 5.3): Die Einheitenumrechnung ist die EINZIGE erlaubte
// Zahlentransformation und läuft per Whitelist – nicht über das LLM. Sie wird
// erst NACH der Maschenzahl-Validierung angewandt, damit "Maschenzahlen sind
// heilig" unberührt bleibt: die validierte Fassung (`deutsch`) bleibt gleich,
// die Anzeige (`deutschAnzeige`) bekommt die umgerechneten Werte, wobei der
// Originalwert stets in Klammern erhalten bleibt.

import type { Einheitenkonvertierung } from '$lib/types';

/** US-Stricknadel-Größen → mm (gängige Tabelle). */
const NADELN_US: Record<string, string> = {
	'0': '2 mm',
	'1': '2,25 mm',
	'2': '2,75 mm',
	'3': '3,25 mm',
	'4': '3,5 mm',
	'5': '3,75 mm',
	'6': '4 mm',
	'7': '4,5 mm',
	'8': '5 mm',
	'9': '5,5 mm',
	'10': '6 mm',
	'10.5': '6,5 mm',
	'11': '8 mm',
	'13': '9 mm',
	'15': '10 mm',
	'17': '12 mm',
	'19': '15 mm',
	'35': '19 mm'
};

/** US-Häkelnadeln (Buchstaben) → mm. */
const HAEKELNADELN_US: Record<string, string> = {
	B: '2,25 mm',
	C: '2,75 mm',
	D: '3,25 mm',
	E: '3,5 mm',
	F: '3,75 mm',
	G: '4 mm',
	H: '5 mm',
	I: '5,5 mm',
	J: '6 mm',
	K: '6,5 mm',
	L: '8 mm',
	M: '9 mm',
	N: '10 mm'
};

// Garngewichte (US) → deutsche Entsprechung. In EINEM Durchlauf ersetzt
// (Alternation, längste Treffer zuerst), damit eingefügter Text nicht erneut
// gescannt wird. "DK" bleibt als deutsche Bezeichnung erhalten und wird daher
// nicht separat annotiert.
const GARNGEWICHTE: Array<[string, string]> = [
	['super bulky', 'Super Bulky / sehr dick'],
	['fingering', 'Fingering / Sockengarn'],
	['worsted', 'Worsted / dickes DK–Aran'],
	['chunky', 'Bulky / dick'],
	['bulky', 'Bulky / dick'],
	['sport', 'Sport / dünnes DK'],
	['aran', 'Aran'],
	['lace', 'Lace / Spitzengarn']
];
const GARN_REGEX = new RegExp(
	`\\b(${GARNGEWICHTE.map(([en]) => en.replace(/\s+/g, '\\s+')).join('|')})\\b`,
	'gi'
);
const GARN_LOOKUP = new Map(GARNGEWICHTE.map(([en, de]) => [en.replace(/\s+/g, ' '), de]));

/** Formatiert eine Zahl deutsch (Punkt → Komma) und rundet auf 1 Nachkommastelle. */
function deZahl(n: number): string {
	return n.toFixed(1).replace(/\.0$/, '').replace('.', ',');
}

/**
 * Wandelt Einheiten in einem Textstück deterministisch um. Gibt den neuen Text
 * sowie die Liste der angewandten Konvertierungen zurück (Originalwert bleibt
 * jeweils in Klammern erhalten).
 */
export function konvertiereEinheiten(text: string): {
	text: string;
	konvertierungen: Einheitenkonvertierung[];
} {
	const konvertierungen: Einheitenkonvertierung[] = [];
	let out = text;

	const merke = (original: string, konvertiert: string) => {
		if (!konvertierungen.some((k) => k.original === original && k.konvertiert === konvertiert)) {
			konvertierungen.push({ original, konvertiert });
		}
	};

	// US-Häkelnadel-Buchstaben, z. B. "hook H" / "H hook" / "size H".
	out = out.replace(
		/\b(?:hook|nadel|size)\s+([B-N])\b|\b([B-N])(?:\/\d+)?\s+(?:hook|crochet hook)\b/g,
		(match, a?: string, b?: string) => {
			const buchstabe = (a ?? b ?? '').toUpperCase();
			const mm = HAEKELNADELN_US[buchstabe];
			if (!mm) return match;
			merke(match.trim(), mm);
			return `${match} (${mm})`;
		}
	);

	// US-Stricknadeln, z. B. "US 7" / "US size 10.5".
	out = out.replace(/\bUS\s*(?:size\s*)?(\d+(?:\.\d+)?)\b/gi, (match, groesse: string) => {
		const mm = NADELN_US[groesse];
		if (!mm) return match;
		merke(match.trim(), mm);
		return `${match} (${mm})`;
	});

	// Zoll → cm. Erfasst Zahl (auch Dezimal/Bruch-Dezimal) vor inch/inches/in/".
	out = out.replace(
		/(\d+(?:[.,]\d+)?)\s*(inches|inch|in\b|")/gi,
		(match, zahl: string) => {
			const wert = parseFloat(zahl.replace(',', '.'));
			if (Number.isNaN(wert)) return match;
			const cm = deZahl(wert * 2.54);
			merke(match.trim(), `${cm} cm`);
			return `${match} (${cm} cm)`;
		}
	);

	// Yards → Meter.
	out = out.replace(/(\d+(?:[.,]\d+)?)\s*(yards|yard|yds|yd)\b/gi, (match, zahl: string) => {
		const wert = parseFloat(zahl.replace(',', '.'));
		if (Number.isNaN(wert)) return match;
		const m = deZahl(wert * 0.9144);
		merke(match.trim(), `${m} m`);
		return `${match} (${m} m)`;
	});

	// Garngewichte – ein Durchlauf, längste Treffer zuerst.
	out = out.replace(GARN_REGEX, (match) => {
		const schluessel = match.toLowerCase().replace(/\s+/g, ' ');
		const de = GARN_LOOKUP.get(schluessel);
		if (!de) return match;
		merke(match.trim(), de);
		return `${match} (${de})`;
	});

	return { text: out, konvertierungen };
}
