// Tests der deterministischen Validierung (PRD 5.3).
//
// "Maschenzahlen sind heilig": Zahlen dürfen sich beim Übersetzen nie ändern.
// Größen-Tupel wie "(4, 6, 8)" bleiben als geordnete Sequenz erhalten
// (nicht summieren/flatten). Zusätzlich: Strukturprüfung (Klammern paarig,
// Reihennummern lückenlos) sowie Einheitenkonvertierung NUR in der Anzeige.

import { describe, it, expect } from 'vitest';
import { extrahiereZahlen, pruefeReihe, pruefeStruktur, validiere } from './validate';
import type { Reihe } from '$lib/types';

/** Kleiner Helfer: baut eine Reihe (maschenzahlen wird von der Prüfung neu extrahiert). */
function reihe(index: number, original: string, deutsch: string): Reihe {
	return { index, original, deutsch, maschenzahlen: [] };
}

describe('extrahiereZahlen', () => {
	it('erfasst freistehende Zahlen', () => {
		expect(extrahiereZahlen('sc 6, then 12')).toEqual(['6', '12']);
	});

	it('hält ein Größen-Tupel als eine geordnete Gruppe zusammen', () => {
		expect(extrahiereZahlen('sc across (4, 6, 8)')).toEqual(['(4,6,8)']);
	});

	it('unterscheidet Tupel und nachfolgende freistehende Zahl', () => {
		expect(extrahiereZahlen('(4, 6, 8) then 12 more')).toEqual(['(4,6,8)', '12']);
	});

	it('behält Dezimalzahlen (Punkt und Komma)', () => {
		expect(extrahiereZahlen('4.5 mm and 2,5 cm')).toEqual(['4.5', '2,5']);
	});

	it('gibt für zahllosen Text eine leere Liste zurück', () => {
		expect(extrahiereZahlen('ch, turn')).toEqual([]);
	});
});

describe('pruefeReihe', () => {
	it('ist ok, wenn die Zahlenfolge exakt übereinstimmt', () => {
		const p = pruefeReihe(reihe(1, 'sc across (12)', 'fM über alle M (12)'));
		expect(p.ok).toBe(true);
		expect(p.zahlenOriginal).toEqual(['(12)']);
		expect(p.zahlenDeutsch).toEqual(['(12)']);
	});

	it('zählt eine Reihennummer im Text als Zahl (bleibt daher erhalten)', () => {
		// Bewusstes Verhalten: "Row 1" liefert die 1 mit; stimmt sie überein, ist alles ok.
		const p = pruefeReihe(reihe(1, 'Row 1: sc across (12)', 'R 1: fM (12)'));
		expect(p.ok).toBe(true);
		expect(p.zahlenOriginal).toEqual(['(12)', '1']);
	});

	it('markiert eine geänderte Maschenzahl als Abweichung', () => {
		const p = pruefeReihe(reihe(1, 'Row 1: sc (12)', 'R 1: fM (21)'));
		expect(p.ok).toBe(false);
	});

	it('achtet auf die Reihenfolge innerhalb eines Größen-Tupels', () => {
		const p = pruefeReihe(reihe(1, 'inc to (4, 6, 8)', 'Zun auf (4, 8, 6)'));
		expect(p.ok).toBe(false);
	});

	it('erkennt eine fehlende Zahl (unterschiedliche Anzahl)', () => {
		const p = pruefeReihe(reihe(1, 'sc 6, sc 6', 'fM 6'));
		expect(p.ok).toBe(false);
	});
});

describe('pruefeStruktur', () => {
	it('meldet stimmige Struktur bei paarigen Klammern und lückenlosen Reihen', () => {
		const s = pruefeStruktur([
			reihe(1, 'Row 1: sc (6)', 'R 1: fM (6)'),
			reihe(2, 'Row 2: sc (12)', 'R 2: fM (12)'),
			reihe(3, 'Row 3: sc (18)', 'R 3: fM (18)')
		]);
		expect(s.klammernPaarig).toBe(true);
		expect(s.reihenLueckenlos).toBe(true);
		expect(s.probleme).toHaveLength(0);
	});

	it('erkennt unpaarige Klammern und benennt Reihe und Feld', () => {
		const s = pruefeStruktur([reihe(2, 'Row 2: sc (12)', 'R 2: fM (12')]);
		expect(s.klammernPaarig).toBe(false);
		expect(s.probleme.some((p) => p.includes('Reihe 2') && p.includes('Deutsch'))).toBe(true);
	});

	it('erkennt einen Sprung in den Reihennummern', () => {
		const s = pruefeStruktur([
			reihe(1, 'Row 1: sc', 'R 1: fM'),
			reihe(2, 'Row 2: sc', 'R 2: fM'),
			reihe(3, 'Row 5: sc', 'R 5: fM')
		]);
		expect(s.reihenLueckenlos).toBe(false);
		expect(s.probleme.some((p) => p.includes('2') && p.includes('5'))).toBe(true);
	});

	it('erlaubt gleiche Reihennummer (Sub-Reihen)', () => {
		const s = pruefeStruktur([
			reihe(1, 'Row 1: sc', 'R 1: fM'),
			reihe(2, 'Row 1: continue', 'R 1: weiter'),
			reihe(3, 'Row 2: sc', 'R 2: fM')
		]);
		expect(s.reihenLueckenlos).toBe(true);
	});

	it('gilt als lückenlos, wenn keine Reihennummern erkennbar sind', () => {
		const s = pruefeStruktur([reihe(1, 'ch 20', 'Lm 20')]);
		expect(s.reihenLueckenlos).toBe(true);
	});
});

describe('validiere', () => {
	it('zählt Abweichungen und liefert Struktur mit', () => {
		const { reihen, abweichungen, struktur } = validiere([
			reihe(1, 'Row 1: sc (6)', 'R 1: fM (6)'),
			reihe(2, 'Row 2: sc (12)', 'R 2: fM (21)')
		]);
		expect(abweichungen).toBe(1);
		expect(reihen[0].pruefung.ok).toBe(true);
		expect(reihen[1].pruefung.ok).toBe(false);
		expect(struktur.klammernPaarig).toBe(true);
	});

	it('wendet Einheitenkonvertierung nur auf die Anzeige an, nicht auf die validierte Fassung', () => {
		const { reihen, konvertierungen } = validiere([
			reihe(1, 'Gauge: US 7 needles', 'Maschenprobe: US 7 Nadeln')
		]);
		// deutsch bleibt roh (für die Zahlenprüfung), Anzeige bekommt die Umrechnung.
		expect(reihen[0].deutsch).toBe('Maschenprobe: US 7 Nadeln');
		expect(reihen[0].deutschAnzeige).toBe('Maschenprobe: US 7 (4,5 mm) Nadeln');
		expect(konvertierungen).toContainEqual({ original: 'US 7', konvertiert: '4,5 mm' });
	});

	it('sammelt Konvertierungen über mehrere Reihen ohne Dubletten', () => {
		const { konvertierungen } = validiere([
			reihe(1, '4 inches', '4 Zoll... 4 inches'),
			reihe(2, '4 inches again', '4 inches')
		]);
		expect(konvertierungen.filter((k) => k.original === '4 inches')).toHaveLength(1);
	});
});
