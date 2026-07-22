// Gemeinsame Typen für die Übersetzungs-Pipeline (Eingabe → Erkennung →
// Übersetzung → Validierung → Ausgabe). Die Struktur ist pro Reihe/Runde
// organisiert, damit Side-by-Side-Synchronisation und Maschenzahl-Prüfung
// direkt über den Reihen-Index laufen (siehe PRD Abschnitt 5).

export type Technik = 'Häkeln' | 'Stricken' | 'Unbekannt';

/** Ergebnis der Erkennungsstufe (Quellsprache, Technik, US/UK). */
export interface Quelle {
	sprache: string;
	technik: Technik;
	/** Bei Englisch: "US", "UK" oder "unklar"; sonst "n/a". */
	terminologie: string;
}

/** Ein Eintrag der automatisch erzeugten deutschen Abkürzungs-Legende. */
export interface LegendenEintrag {
	abk: string;
	bedeutung: string;
}

/** Eine Struktureinheit (Reihe/Runde) – Original und deutsche Übersetzung. */
export interface Reihe {
	/** Reihen-Index als Schlüssel für die Side-by-Side-Synchronisation. */
	index: number;
	original: string;
	deutsch: string;
	/**
	 * Vom Modell extrahierte Maschenzahlen der Reihe, in Reihenfolge.
	 * Klammer-Tupel für Größen bleiben als einzelner Eintrag erhalten,
	 * z. B. "(4, 6, 8)" (nicht summieren/flatten).
	 */
	maschenzahlen: string[];
}

/** Rohes, vom LLM per Structured Output geliefertes Übersetzungsergebnis. */
export interface Uebersetzung {
	quelle: Quelle;
	legende: LegendenEintrag[];
	reihen: Reihe[];
}

/** Ergebnis der deterministischen Maschenzahl-Prüfung pro Reihe. */
export interface ReihenPruefung {
	/** true, wenn die Zahlenfolge in Original und Deutsch exakt übereinstimmt. */
	ok: boolean;
	zahlenOriginal: string[];
	zahlenDeutsch: string[];
}

/** Eine Reihe angereichert um das deterministische Prüfergebnis. */
export interface GepruefteReihe extends Reihe {
	pruefung: ReihenPruefung;
}

/** Vollständige Antwort des Übersetzungs-Endpunkts an den Browser. */
export interface UebersetzungsErgebnis {
	quelle: Quelle;
	legende: LegendenEintrag[];
	reihen: GepruefteReihe[];
	/** Anzahl Reihen mit Maschenzahl-Abweichung (0 = alles stimmig). */
	abweichungen: number;
}
