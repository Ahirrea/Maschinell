// Integritätstests der Glossar-Rohdaten (data.ts). Da diese Daten sowohl den
// Prompt als auch die Validierung und die Nachschlage-Ansicht speisen, sind
// leere Felder oder doppelte Quell-Terme echte Fehlerquellen.

import { describe, it, expect } from 'vitest';
import { HAEKELN, STRICKEN, type GlossarZeile } from './data';

const alle: Array<[string, GlossarZeile[]]> = [
	['Häkeln', HAEKELN],
	['Stricken', STRICKEN]
];

describe.each(alle)('Glossar – %s', (_name, zeilen) => {
	it('hat Einträge', () => {
		expect(zeilen.length).toBeGreaterThan(0);
	});

	it('hat in jeder Zeile alle Felder befüllt', () => {
		for (const z of zeilen) {
			expect(z.us.trim()).not.toBe('');
			expect(z.uk.trim()).not.toBe('');
			expect(z.de.trim()).not.toBe('');
			expect(z.bedeutung.trim()).not.toBe('');
		}
	});

	it('hat eindeutige US-Quell-Terme (keine kollidierenden Zuordnungen)', () => {
		const us = zeilen.map((z) => z.us);
		expect(new Set(us).size).toBe(us.length);
	});

	it('hat eindeutige deutsche Ziel-Abkürzungen', () => {
		const de = zeilen.map((z) => z.de);
		expect(new Set(de).size).toBe(de.length);
	});
});
