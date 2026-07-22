// Gemeinsame Typen für die Übersetzungs-Pipeline (Eingabe → Erkennung →
// Übersetzung → Validierung → Ausgabe). Die Struktur ist pro Reihe/Runde
// organisiert, damit Side-by-Side-Synchronisation und Maschenzahl-Prüfung
// direkt über den Reihen-Index laufen (siehe PRD Abschnitt 5).

export type Technik = 'Häkeln' | 'Stricken' | 'Unbekannt';

/** Bei Englisch: US/UK ist zwingend; sonst "n/a". "unklar" nur vor der Bestätigung. */
export type Terminologie = 'US' | 'UK' | 'unklar' | 'n/a';

// ── Stufe 1: Erkennung (mit Bestätigungsdialog, PRD 5.1) ────────────────────

/** Eine erkannte Größenvariante einer Mehrgrößen-Anleitung (Klammer-Tupel). */
export interface Groesse {
	/** Position im Klammer-Tupel `(S, M, L)` → 0, 1, 2. */
	index: number;
	/** Anzeigename, z. B. "S", "M", "L" oder "Größe 1". */
	name: string;
}

/**
 * Ergebnis der Erkennungsstufe. Wird VOR der Übersetzung angezeigt und ist
 * korrigierbar – der Bestätigungsschritt verhindert die schlimmste
 * Fehlerklasse (US/UK-Fehlklassifikation).
 */
export interface Erkennung {
	sprache: string;
	technik: Technik;
	terminologie: Terminologie;
	/** Kurze Begründung der US/UK-Einordnung (Marker im Text) – schafft Vertrauen. */
	begruendung: string;
	/** Erkannte Größen; leere Liste = Anleitung hat nur eine Größe. */
	groessen: Groesse[];
}

// ── Stufe 2: Übersetzung (Structured Output) ────────────────────────────────

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
	legende: LegendenEintrag[];
	reihen: Reihe[];
}

// ── Stufe 3: Validierung (deterministisch, PRD 5.3) ─────────────────────────

/** Ergebnis der deterministischen Maschenzahl-Prüfung pro Reihe. */
export interface ReihenPruefung {
	/** true, wenn die Zahlenfolge in Original und Deutsch exakt übereinstimmt. */
	ok: boolean;
	zahlenOriginal: string[];
	zahlenDeutsch: string[];
}

/** Eine Reihe angereichert um Prüfergebnis und (optional) konvertierte Anzeige. */
export interface GepruefteReihe extends Reihe {
	pruefung: ReihenPruefung;
	/**
	 * Deutsche Fassung mit deterministisch umgerechneten Einheiten (Stufe 4).
	 * Enthält den Originalwert in Klammern; `deutsch` bleibt für die
	 * Validierung unverändert.
	 */
	deutschAnzeige: string;
}

/** Deterministische Strukturprüfung über die gesamte Anleitung (PRD 5.3). */
export interface StrukturPruefung {
	/** Klammern über alle Reihen paarig ( `(` = `)` ). */
	klammernPaarig: boolean;
	/** Erkannte Reihennummern im Original sind lückenlos aufsteigend. */
	reihenLueckenlos: boolean;
	/** Menschenlesbare Hinweise zu gefundenen Struktur-Auffälligkeiten. */
	probleme: string[];
}

// ── Stufe 4: Ausgabe ────────────────────────────────────────────────────────

/** Eine deterministisch angewandte Einheitenkonvertierung (für die Übersicht). */
export interface Einheitenkonvertierung {
	original: string;
	konvertiert: string;
}

// ── API-Verträge ────────────────────────────────────────────────────────────

/** Request an POST /api/detect. */
export interface ErkennungsAnfrage {
	text: string;
}

/** Request an POST /api/translate: Text + bestätigte Erkennung + Größenwahl. */
export interface UebersetzungsAnfrage {
	text: string;
	erkennung: Erkennung;
	/** Index der gewählten Größe, oder null (einzelne Größe / keine Wahl). */
	groesseIndex: number | null;
}

/** Vollständige Antwort des Übersetzungs-Endpunkts an den Browser. */
export interface UebersetzungsErgebnis {
	erkennung: Erkennung;
	/** Index der gewählten Größe (für Hervorhebung im Text), oder null. */
	groesseIndex: number | null;
	legende: LegendenEintrag[];
	reihen: GepruefteReihe[];
	struktur: StrukturPruefung;
	konvertierungen: Einheitenkonvertierung[];
	/** Anzahl Reihen mit Maschenzahl-Abweichung (0 = alles stimmig). */
	abweichungen: number;
}
