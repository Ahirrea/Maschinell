// Tests der deterministischen Einheitenkonvertierung (PRD 5.4).
//
// Diese Umrechnung ist die EINZIGE erlaubte Zahlentransformation der Pipeline
// (Whitelist). Wichtig: Der Originalwert bleibt stets in Klammern erhalten,
// und bereits eingefügter Text darf nicht erneut gescannt werden.

import { describe, it, expect } from 'vitest';
import { konvertiereEinheiten } from './units';

describe('konvertiereEinheiten – Nadeln', () => {
	it('rechnet US-Stricknadeln in mm um und behält den Originalwert', () => {
		const { text, konvertierungen } = konvertiereEinheiten('US 7 needles');
		expect(text).toBe('US 7 (4,5 mm) needles');
		expect(konvertierungen).toContainEqual({ original: 'US 7', konvertiert: '4,5 mm' });
	});

	it('erkennt Dezimalgrößen wie US 10.5 vollständig (kein Teiltreffer)', () => {
		const { text } = konvertiereEinheiten('Needle US 10.5.');
		expect(text).toBe('Needle US 10.5 (6,5 mm).');
	});

	it('erkennt "US size 8" mit optionalem "size"', () => {
		const { text } = konvertiereEinheiten('US size 8');
		expect(text).toBe('US size 8 (5 mm)');
	});

	it('lässt unbekannte US-Nummern unverändert', () => {
		const { text, konvertierungen } = konvertiereEinheiten('US 99 needles');
		expect(text).toBe('US 99 needles');
		expect(konvertierungen).toHaveLength(0);
	});

	it('rechnet US-Häkelnadel-Buchstaben um (size H)', () => {
		const { text, konvertierungen } = konvertiereEinheiten('Use a size H hook');
		expect(text).toBe('Use a size H (5 mm) hook');
		expect(konvertierungen).toContainEqual({ original: 'size H', konvertiert: '5 mm' });
	});
});

describe('konvertiereEinheiten – Maße', () => {
	it('rechnet inches in cm um', () => {
		const { text } = konvertiereEinheiten('gauge over 4 inches');
		expect(text).toBe('gauge over 4 inches (10,2 cm)');
	});

	it('erkennt das Zoll-Zeichen "', () => {
		const { text, konvertierungen } = konvertiereEinheiten('a 4" band');
		expect(text).toBe('a 4" (10,2 cm) band');
		expect(konvertierungen).toContainEqual({ original: '4"', konvertiert: '10,2 cm' });
	});

	it('akzeptiert Dezimalzahlen mit Punkt und Komma', () => {
		expect(konvertiereEinheiten('2.5 inch').text).toBe('2.5 inch (6,3 cm)');
		expect(konvertiereEinheiten('2,5 inch').text).toBe('2,5 inch (6,3 cm)');
	});

	it('rechnet yards in Meter um', () => {
		const { text } = konvertiereEinheiten('200 yards');
		expect(text).toBe('200 yards (182,9 m)');
	});
});

describe('konvertiereEinheiten – Garngewichte', () => {
	it('ordnet worsted einer deutschen Entsprechung zu', () => {
		const { text } = konvertiereEinheiten('worsted weight');
		expect(text).toBe('worsted (Worsted / dickes DK–Aran) weight');
	});

	it('bevorzugt den längeren Treffer "super bulky" vor "bulky"', () => {
		const { text, konvertierungen } = konvertiereEinheiten('super bulky yarn');
		expect(text).toBe('super bulky (Super Bulky / sehr dick) yarn');
		expect(konvertierungen).toContainEqual({
			original: 'super bulky',
			konvertiert: 'Super Bulky / sehr dick'
		});
	});

	it('annotiert eingefügten Text NICHT erneut (kein Doppel-Scan des DK aus worsted)', () => {
		const { text } = konvertiereEinheiten('worsted');
		// "DK" steckt in der Ersetzung, darf aber nicht selbst annotiert werden.
		expect(text).toBe('worsted (Worsted / dickes DK–Aran)');
		expect(text).not.toContain('DK (');
	});
});

describe('konvertiereEinheiten – Allgemeines', () => {
	it('gibt bei fehlenden Einheiten den Text unverändert zurück', () => {
		const { text, konvertierungen } = konvertiereEinheiten('sc across (12)');
		expect(text).toBe('sc across (12)');
		expect(konvertierungen).toHaveLength(0);
	});

	it('sammelt jede Konvertierung nur einmal (dedupliziert)', () => {
		const { konvertierungen } = konvertiereEinheiten('4 inches wide, then 4 inches tall');
		const cm = konvertierungen.filter((k) => k.original === '4 inches');
		expect(cm).toHaveLength(1);
	});

	it('wendet mehrere verschiedene Konvertierungen in einem Text an', () => {
		const { konvertierungen } = konvertiereEinheiten('US 7 needles, 4 inches, 200 yards worsted');
		expect(konvertierungen.map((k) => k.original)).toEqual([
			'US 7',
			'4 inches',
			'200 yards',
			'worsted'
		]);
	});
});
