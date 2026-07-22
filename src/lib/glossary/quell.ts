// Kuratierte Quell-Glossare EN-US → DE und EN-UK → DE (PRD 5.2, Phase 1).
//
// Nachdem die Erkennung bestätigt wurde (US ODER UK – die schlimmste
// Fehlerklasse ist entschieden), bekommt das Modell GENAU das passende
// Quell-Glossar als Leitplanke. So wird z. B. ein UK-"double crochet"
// zuverlässig als feste Masche (fM) und nicht als Stäbchen (Stb) übersetzt.
//
// Die Daten stammen aus data.ts (dieselbe Quelle wie das Ziel-Glossar).

import { HAEKELN, STRICKEN, type GlossarZeile } from './data';
import type { Terminologie } from '$lib/types';

/** Baut einen Glossar-Block für genau eine Terminologie-Seite (US oder UK). */
function seite(zeilen: GlossarZeile[], terminologie: 'US' | 'UK'): string {
	return zeilen
		.map((z) => {
			const quelle = terminologie === 'US' ? z.us : z.uk;
			return `- "${quelle}" → DE "${z.de}" (${z.bedeutung})`;
		})
		.join('\n');
}

/**
 * Liefert den Quell-Glossar-Block für die bestätigte Terminologie oder eine
 * leere Zeichenkette, wenn kein kuratiertes Glossar greift (freie Übersetzung
 * mit hartem Ziel-Glossar, siehe PRD F8).
 */
export function quellGlossarPrompt(terminologie: Terminologie): string {
	if (terminologie !== 'US' && terminologie !== 'UK') return '';

	const hinweis =
		terminologie === 'US'
			? 'Dies ist eine US-Anleitung. In US-Terminologie ist "single crochet" = feste Masche (fM) und "double crochet" = Stäbchen (Stb).'
			: 'Dies ist eine UK-Anleitung. In UK-Terminologie ist "double crochet" = feste Masche (fM) und "treble" = Stäbchen (Stb). Es gibt KEIN "single crochet".';

	return `## Bestätigtes Quell-Glossar: Englisch (${terminologie})
${hinweis}
Verwende ausschließlich diese EN-${terminologie}→DE-Zuordnung:

### Häkeln
${seite(HAEKELN, terminologie)}

### Stricken
${seite(STRICKEN, terminologie)}
`;
}
