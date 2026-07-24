# Backlog – Maschinell

Stand: 2026-07-24. Quelle: [PRD.md](./PRD.md) (bei Widerspruch gilt PRD), Abgleich mit tatsächlichem Code.

## Status

**Phase 1 (MVP „Vertrauenswürdig übersetzen“) ist funktional komplett.** Die volle vierstufige Pipeline (Erkennung → Übersetzung → Validierung → Ausgabe) steht und ist im Code verifiziert. Offen: Test mit echten Anleitungen (letzter Phase-0-Haken) sowie Phasen 2–4.

## Implementiert

| Feature | Ort | PRD |
|---|---|---|
| Zweistufiger Wizard (Eingabe → Bestätigung → Ergebnis) | `src/routes/+page.svelte` | F1, 5.x |
| Erkennung (Sprache/Technik/US-UK/Größen) via LLM | `src/lib/server/detect.ts`, `/api/detect` | F2 |
| Bestätigungsdialog, korrigierbar, US/UK-Warnung | `src/routes/+page.svelte` | F2 (Pflicht) |
| Größen-Auswahl + Hervorhebung im Klammer-Tupel | `src/routes/+page.svelte` (`segmentiere()`) | F2b |
| Übersetzung mit bestätigter Erkennung als Fakt-Vorgabe | `src/lib/server/translate.ts` | F3 |
| Quell-Glossar EN-US/EN-UK + hartes DE-Ziel-Glossar | `src/lib/glossary/quell.ts`, `de-ziel.ts` | F3 |
| Prompt Caching (Ziel-Glossar `cache_control`) | `src/lib/server/translate.ts` | Tech |
| Structured Outputs (JSON-Schema, Reihen + Maschenzahlen) | `src/lib/server/translate.ts` | Tech |
| Maschenzahl-Validierung + Markierung | `src/lib/server/validate.ts` | F5 |
| Strukturprüfung (Klammern paarig, Reihen lückenlos) | `src/lib/server/validate.ts` | F4 |
| Klammer-Tupel als geordnete Sequenz erhalten (nicht summieren/flatten) | `src/lib/server/validate.ts` | 5.3 |
| Einheitenkonvertierung (Whitelist, nach Validierung) | `src/lib/server/units.ts` | F6 |
| Side-by-Side + automatische DE-Legende | `src/routes/+page.svelte` | F7 |
| Freie Quellsprachen ohne kuratiertes Glossar | `src/lib/glossary/quell.ts` | F8 |
| Markdown-Export (Kopieren + Download) | `src/lib/markdown.ts` | F9 |
| Glossar-Nachschlage-Ansicht (clientseitig) | `src/routes/glossar/+page.svelte` | — |
| Demo-/Vorschaumodus ohne API | `src/lib/demo.ts` | — |
| Tests (Vitest): units, validate, glossary/data, demo | `src/**/*.test.ts` | — |

## Fehlt / offen

- **Phase 0, letzter Haken:** Test mit 2–3 echten Anleitungen, Fehlerklassen dokumentieren (PRD 8).
- **Phase 2 komplett:** PDF-Upload, Web-Import (URL), Foto/OCR, weitere Quell-Glossare.
- **Phase 3 komplett:** Bibliothek (IndexedDB), Reihenzähler, aktuelle-Reihe-Modus, Sprachsteuerung.
- **Phase 4 komplett:** Charts/Zählmuster, japanische Symbol-Diagramme, Mehrbenutzer-Öffnung.
- **Test-Lücken (nicht in Roadmap):** keine Tests für `detect.ts`/`translate.ts` (LLM-Aufrufe), `markdown.ts`, UI-Wizard.

---

## Backlog (priorisiert)

### P0 — Phase 1 abschließen

1. **Echte Anleitungen testen.** Je 1× Häkeln/Stricken × US/UK durchlaufen. DoD (PRD 7): komplett nacharbeitbar ohne Original, Maschenzahlen zu 100 % identisch oder korrekt als Abweichung markiert, UK-Anleitung nachweislich nicht US-gemappt (Testfall *double crochet*).
2. **Fehlerklassen dokumentieren** aus (1); Prompt und Glossar nachschärfen.
3. **Fehlerbehandlung robuster.** Fehlender/ungültiger `ANTHROPIC_API_KEY`, Timeout, Schema-Parse-Fehler nutzerfreundlich statt rohem `Fehler ${status}`.

### P1 — Qualität absichern

4. **Sonnet-5-Kostenvergleich** (PRD 10). Qualität bei ~halben Kosten prüfen; Modell hinter Konstante/Config konfigurierbar.
5. **Tests für Server-Stufen.** `detect`/`translate` mit gemocktem SDK; `markdown` als reine Funktion.
6. **Prompt-Cache verifizieren.** Cache-Trefferquote/Kosten pro Folgeübersetzung messen.

### P2 — Phase 2 (Quellen erweitern)

7. **PDF-Upload** (eingebetteter Text, kein OCR) — deckt Ravelry/Etsy-Käufe.
8. **Web-Import per URL** (Parsing von Blog-Anleitungen).
9. **Foto/OCR** — härteste Variante; OCR-Fehler bei Abkürzungen (`sl st` vs. `st st`) gezielt gegen Glossar nachkorrigieren.
10. **Weitere kuratierte Quell-Glossare** (NL/DK/FR …) nach Bedarf.

### P3 — Phase 3 (Begleitmodus)

11. **Bibliothek** — IndexedDB hinter Storage-Interface, JSON-Export/Import.
12. **Reihenzähler + Fortschritt** pro Anleitung.
13. **Aktuelle-Reihe-Hervorhebung**, Schritt-für-Schritt-Modus.
14. **Sprachsteuerung** („nächste Reihe“ — beim Häkeln ist keine Hand frei).

### P4 — Ausblick

15. Charts/Zählmuster (strukturierte Tabellen).
16. Japanische Symbol-Diagramme (Bilderkennung).
17. Mehrbenutzer-Öffnung (dann: Copyright-Konzept, Accounts).
