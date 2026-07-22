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
2. **Übersetzung** – LLM + Glossar-Leitplanken: kuratiertes Quell-Glossar (EN-US, EN-UK) + **hartes deutsches Ziel-Glossar**. Struktur (Reihennummern, Klammern, Wiederholungen, Maschenzahlen) darf nie verändert werden. Granularität: **pro Struktureinheit (Reihe/Runde)** mit Reihen-Index als Schlüssel für die Side-by-Side-Synchronisation.
3. **Validierung** – deterministisch, sprachunabhängig: Maschenzahl-Invariante und Strukturprüfung; Abweichungen werden markiert, nicht stillschweigend korrigiert. Klammer-Tupel für Größen (`(4, 6, 8)`) werden als geordnete Sequenz exakt erhalten (nicht summieren/flatten). Bei Mehrgrößen-Anleitungen: Größen-Auswahl vor der Übersetzung, gewählte Größe im Ergebnis hervorgehoben.
4. **Ausgabe** – Side-by-Side (Original | Deutsch), automatische DE-Legende, Einheitenkonvertierung (Nadeln US→mm, inch→cm, Garngewichte).

## Nicht-Ziele (MVP)

Kein OCR/Foto (Phase 2), keine Charts/Symbol-Diagramme (Phase 4), kein Multi-User/Accounts/Monetarisierung, kein Teilen/Veröffentlichen übersetzter Anleitungen (Copyright – nur privater Gebrauch).

## Zentrale Prinzipien beim Entwickeln

- **Maschenzahlen sind heilig.** Zahlen aus dem Original dürfen sich beim Übersetzen nie ändern (außer bewusster Einheitenkonvertierung). Diese Invariante deterministisch prüfen, nicht dem LLM überlassen.
- **US/UK-Fehlklassifikation ist die schlimmste Fehlerklasse.** Der Bestätigungsschritt vor der Übersetzung ist Pflicht.
- **Das Glossar ist die zentrale Wahrheitsquelle** für Prompt *und* Validierung. Geplant als eigener Ordner `glossary/` (siehe PRD Anhang 11).

## Tech-Stack

- **LLM:** Claude. Phase 0 mit **Opus 4.8** (`claude-opus-4-8`); später Prüfung auf **Sonnet 5** (`claude-sonnet-5`) zur Kostensenkung. Immer die aktuellen Claude-Modelle verwenden.
- **Glossar via Prompt Caching:** DE-Ziel-Glossar + Quell-Glossare als stabiler, gecachter Prompt-Präfix (~10 % Kosten bei Folgeübersetzungen).
- **Structured Outputs** für die Modellausgabe (Reihen mit Nummer + Maschenzahlen), damit die deterministische Validierung einfach aufsetzt.
- **Bibliothek (Phase 3):** IndexedDB im Browser + JSON-Export/Import; hinter Storage-Interface kapseln.
- **Web-Framework:** **SvelteKit** (TypeScript, Svelte 5 mit Runes). Der Claude-Aufruf, Glossar-Caching und die Validierung laufen serverseitig in `+server.ts` / `+page.server.ts`; der `ANTHROPIC_API_KEY` kommt aus `$env/static/private` und erreicht den Browser nie.

## Status

Phase 1 (MVP „Vertrauenswürdig übersetzen“). Die volle Pipeline steht: **zweistufiger Ablauf** mit Erkennung (`/api/detect`) → Bestätigungsdialog (Sprache/Technik/US-UK/Größe) → Übersetzung (`/api/translate`) mit bestätigter Erkennung. Kuratierte Quell-Glossare (EN-US/EN-UK) und hartes DE-Ziel-Glossar; deterministische Maschenzahl- **und** Strukturvalidierung; Einheitenkonvertierung (Nadeln, Zoll, Yards, Garngewichte) als einzige erlaubte Zahlentransformation nach der Validierung; Markdown-Export. Nächster Schritt: Test mit echten Anleitungen, danach Phase 2 (Quellen: PDF/Web/OCR).

### Struktur (Phase 1)
- `src/lib/glossary/data.ts` – Glossar-Rohdaten (eine Quelle für Ziel- und Quell-Glossar).
- `src/lib/glossary/de-ziel.ts` – hartes DE-Ziel-Glossar als gecachter Prompt-Präfix.
- `src/lib/glossary/quell.ts` – EN-US/EN-UK-Quell-Glossar je nach bestätigter Terminologie.
- `src/lib/server/detect.ts` – Erkennungsstufe (LLM).
- `src/lib/server/translate.ts` – Übersetzung mit bestätigter Erkennung + Quell-Glossar.
- `src/lib/server/units.ts` – deterministische Einheitenkonvertierung (Whitelist).
- `src/lib/server/validate.ts` – Maschenzahl- + Strukturprüfung, wendet Einheiten NACH der Prüfung an.
- `src/lib/markdown.ts` – Markdown-Export (reine Funktion, clientseitig genutzt).
