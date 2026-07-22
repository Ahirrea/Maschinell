// Wächter-Test für den Demomodus.
//
// Der Demomodus hinterlegt die abgeleiteten Felder (Prüfung, Anzeige, Struktur,
// Konvertierungen, Abweichungen) hart, damit er ohne Server auskommt. Dieser
// Test rechnet sie aus den Roh-Reihen über die ECHTE `validiere()`-Pipeline
// nach und stellt sicher, dass das Beispiel nie unbemerkt von der Realität
// abweicht – ändert sich die Validierung oder Einheitenkonvertierung, schlägt
// hier auf, dass `DEMO_ERGEBNIS` neu erzeugt werden muss.

import { describe, it, expect } from 'vitest';
import { validiere } from './server/validate';
import { DEMO_ERGEBNIS, DEMO_ROHREIHEN } from './demo';

describe('Demomodus', () => {
	const v = validiere(DEMO_ROHREIHEN);

	it('hinterlegte geprüfte Reihen entsprechen der echten Pipeline', () => {
		expect(DEMO_ERGEBNIS.reihen).toEqual(v.reihen);
	});

	it('hinterlegte Strukturprüfung entspricht der echten Pipeline', () => {
		expect(DEMO_ERGEBNIS.struktur).toEqual(v.struktur);
	});

	it('hinterlegte Einheitenkonvertierungen entsprechen der echten Pipeline', () => {
		expect(DEMO_ERGEBNIS.konvertierungen).toEqual(v.konvertierungen);
	});

	it('hinterlegte Abweichungszahl entspricht der echten Pipeline', () => {
		expect(DEMO_ERGEBNIS.abweichungen).toBe(v.abweichungen);
	});

	it('demonstriert alle Ausgabe-Zustände', () => {
		// Genau eine Maschenzahl-Abweichung, damit der ⚠-Zustand sichtbar ist.
		expect(DEMO_ERGEBNIS.abweichungen).toBe(1);
		// Struktur-Warnung vorhanden (Lücke in den Reihennummern).
		expect(DEMO_ERGEBNIS.struktur.reihenLueckenlos).toBe(false);
		expect(DEMO_ERGEBNIS.struktur.probleme.length).toBeGreaterThan(0);
		// Einheitenanzeige und Legende sind befüllt.
		expect(DEMO_ERGEBNIS.konvertierungen.length).toBeGreaterThan(0);
		expect(DEMO_ERGEBNIS.legende.length).toBeGreaterThan(0);
		// Mehrgrößen-Anleitung mit gewählter Größe (für die Tupel-Hervorhebung).
		expect(DEMO_ERGEBNIS.erkennung.groessen.length).toBeGreaterThan(1);
		expect(DEMO_ERGEBNIS.groesseIndex).not.toBeNull();
	});
});
