// Markdown-Export der Übersetzung (PRD F9, Stufe 4).
//
// Reine Funktion ohne Server-Abhängigkeiten – wird im Browser für den
// Kopieren- und Herunterladen-Button verwendet. Nutzt die
// einheitenkonvertierte Anzeige (`deutschAnzeige`), damit der Export dem
// Bildschirm entspricht.

import type { UebersetzungsErgebnis } from './types';

/** Escaped Pipe-Zeichen, damit Zellinhalte Markdown-Tabellen nicht zerbrechen. */
function zelle(text: string): string {
	return text.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

/** Baut das komplette Markdown-Dokument der Übersetzung. */
export function alsMarkdown(ergebnis: UebersetzungsErgebnis): string {
	const { erkennung, groesseIndex, legende, reihen, struktur, konvertierungen, abweichungen } =
		ergebnis;

	const teile: string[] = [];

	teile.push('# Übersetzung (Maschinell)');
	teile.push('');

	const term =
		erkennung.terminologie && erkennung.terminologie !== 'n/a'
			? ` (${erkennung.terminologie})`
			: '';
	teile.push(`**Erkannt:** ${erkennung.sprache}${term} · ${erkennung.technik}`);

	const gewaehlt =
		groesseIndex !== null ? erkennung.groessen.find((g) => g.index === groesseIndex) : undefined;
	if (gewaehlt) teile.push(`**Gewählte Größe:** ${gewaehlt.name}`);

	teile.push(
		abweichungen > 0
			? `**⚠ ${abweichungen} Reihe(n) mit Maschenzahl-Abweichung** – vor dem Arbeiten prüfen.`
			: '**✓ Maschenzahlen stimmig.**'
	);
	if (!struktur.klammernPaarig || !struktur.reihenLueckenlos) {
		teile.push('**⚠ Struktur-Hinweise:**');
		for (const p of struktur.probleme) teile.push(`- ${p}`);
	}
	teile.push('');

	if (legende.length > 0) {
		teile.push('## Legende');
		for (const e of legende) teile.push(`- **${e.abk}** – ${e.bedeutung}`);
		teile.push('');
	}

	teile.push('## Anleitung');
	teile.push('');
	teile.push('| # | Original | Deutsch |');
	teile.push('|---|---|---|');
	for (const r of reihen) {
		const markierung = r.pruefung.ok ? '' : ' ⚠';
		teile.push(`| ${r.index} | ${zelle(r.original)} | ${zelle(r.deutschAnzeige)}${markierung} |`);
	}
	teile.push('');

	if (konvertierungen.length > 0) {
		teile.push('## Einheitenumrechnung');
		for (const k of konvertierungen) teile.push(`- ${k.original} → ${k.konvertiert}`);
		teile.push('');
	}

	teile.push('---');
	teile.push('*Übersetzt mit Maschinell – nur für den privaten Gebrauch.*');

	return teile.join('\n');
}
