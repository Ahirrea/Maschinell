# CLAUDE.md

Leitfaden für die Arbeit an **Maschinell** mit Claude Code. Details zum Produkt stehen in [README.md](./README.md) und [PRD.md](./PRD.md) – bei Widerspruch gilt das PRD.

## Projekt in einem Satz

Übersetzt Häkel- und Strickanleitungen aus jeder Sprache in einheitliches Deutsch – mit Fachglossar, Strukturerhalt und automatischer Maschenzahl-Prüfung.

## Arbeitsweise & Konventionen

- **Solo-Entwicklung.** Katharina ist alleinige Entwicklerin. Keine Team-Prozesse annehmen.
- **Nur `main`.** Es wird ausschließlich auf dem `main`-Branch entwickelt. **Keine Feature-Branches, keine Pull Requests.** Commits gehen direkt auf `main` und werden dorthin gepusht.
- **Commits** klein halten und in Deutsch mit klarer, beschreibender Nachricht.
- **Sprache:** Produkt-, Doku- und UI-Sprache ist Deutsch. Code-Bezeichner dürfen Englisch sein.

## Architektur-Kern (siehe PRD Abschnitt 5)

Der Wert liegt in einer vierstufigen Pipeline, nicht in der Oberfläche:

```
Eingabe → 1. Erkennung → 2. Übersetzung → 3. Validierung → 4. Ausgabe
```

1. **Erkennung** – Quellsprache, Technik (Häkeln/Stricken) und bei Englisch zwingend US- vs. UK-Terminologie; Ergebnis wird vor der Übersetzung bestätigt.
2. **Übersetzung** – LLM + Glossar-Leitplanken: kuratiertes Quell-Glossar (EN-US, EN-UK) + **hartes deutsches Ziel-Glossar**. Struktur (Reihennummern, Klammern, Wiederholungen, Maschenzahlen) darf nie verändert werden.
3. **Validierung** – deterministisch, sprachunabhängig: Maschenzahl-Invariante und Strukturprüfung; Abweichungen werden markiert, nicht stillschweigend korrigiert.
4. **Ausgabe** – Side-by-Side (Original | Deutsch), automatische DE-Legende, Einheitenkonvertierung (Nadeln US→mm, inch→cm, Garngewichte).

## Nicht-Ziele (MVP)

Kein OCR/Foto (Phase 2), keine Charts/Symbol-Diagramme (Phase 4), kein Multi-User/Accounts/Monetarisierung, kein Teilen/Veröffentlichen übersetzter Anleitungen (Copyright – nur privater Gebrauch).

## Zentrale Prinzipien beim Entwickeln

- **Maschenzahlen sind heilig.** Zahlen aus dem Original dürfen sich beim Übersetzen nie ändern (außer bewusster Einheitenkonvertierung). Diese Invariante deterministisch prüfen, nicht dem LLM überlassen.
- **US/UK-Fehlklassifikation ist die schlimmste Fehlerklasse.** Der Bestätigungsschritt vor der Übersetzung ist Pflicht.
- **Das Glossar ist die zentrale Wahrheitsquelle** für Prompt *und* Validierung. Geplant als eigener Ordner `glossary/` (siehe PRD Anhang 11).

## Status

Phase 0 (Durchstich/Prototyp). Tech-Stack (LLM-Anbieter, Web-Framework) ist noch offen – siehe offene Fragen im PRD Abschnitt 10. Diese Datei aktualisieren, sobald der Stack feststeht.
