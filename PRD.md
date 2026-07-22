# PRD – Maschinell

**Übersetzt Häkel- und Strickanleitungen aus jeder Sprache in einheitliches Deutsch.**

| | |
|---|---|
| Status | Entwurf v0.1 |
| Autor:in | – |
| Stand | Juli 2026 |
| Zielgruppe (initial) | Persönliches Projekt (Single User) |

---

## 1. Problem

Wer im deutschsprachigen Raum häkelt oder strickt, findet die interessantesten Anleitungen oft auf Englisch (Ravelry, Etsy, Blogs) oder in anderen Sprachen. Generische Übersetzer (DeepL, Google Translate) versagen an dieser Textsorte zuverlässig, weil:

1. **Fachabkürzungen nicht verstanden werden** – `sc`, `hdc`, `k2tog`, `yo` sind keine Wörter, sondern Fachcodes.
2. **US- und UK-Terminologie kollidieren** – ein *double crochet* ist in US-Anleitungen ein Stäbchen, in UK-Anleitungen eine feste Masche. Ohne Dialekt-Erkennung ist jede Übersetzung potenziell falsch, ohne dass man es merkt.
3. **Die Struktur zerstört wird** – Reihennummern, Wiederholungsklammern und Maschenzahlen am Zeilenende gehen in Fließtext-Übersetzungen verloren.
4. **Einheiten nicht konvertiert werden** – Nadelstärken (US 7 vs. 4,5 mm), inches vs. cm, Garngewichte (worsted, DK, fingering).

Ein einziger Übersetzungsfehler in Reihe 12 bedeutet, dass man 30 Reihen später ribbeln darf. Das Vertrauensproblem ist deshalb genauso wichtig wie das Übersetzungsproblem.

## 2. Vision

Eine Anleitung – egal aus welcher Sprache, egal aus welcher Quelle – wird in **standardisiertes, konsistentes Deutsch** übersetzt: korrekte Fachterminologie, erhaltene Struktur, konvertierte Einheiten, automatisch geprüfte Maschenzahlen. Später begleitet die App auch beim Arbeiten (Reihenzähler, Fortschritt).

## 3. Ziele & Nicht-Ziele

### Ziele (MVP)

- Eine eingefügte fremdsprachige Anleitung (Fokus zunächst: Englisch US/UK) wird korrekt und vollständig nach Deutsch übersetzt.
- Die Ausgabe verwendet **immer dasselbe deutsche Abkürzungssystem** (einheitliches Ziel-Glossar) inkl. Legende am Anfang.
- Struktur (Reihen, Runden, Klammern, Maschenzahlen) bleibt exakt erhalten.
- Maschenzahlen werden automatisch gegen das Original validiert; Abweichungen werden markiert.
- Side-by-Side-Ansicht: Original links, Deutsch rechts.

### Nicht-Ziele (MVP)

- Kein OCR / keine Foto-Erkennung (kommt in Phase 2).
- Keine Zählmuster/Charts/Symbol-Diagramme (kommt frühestens Phase 4).
- Kein Multi-User-Betrieb, keine Accounts, keine Monetarisierung.
- Kein Teilen/Veröffentlichen übersetzter Anleitungen (Copyright – Übersetzung nur für den privaten Gebrauch).

## 4. Zielnutzer:in

Initial: die Entwicklerin selbst. Häkelt **und** strickt, kauft Anleitungen überwiegend auf Englisch, gelegentlich in anderen Sprachen. Die App wird so gebaut, dass eine spätere Öffnung für andere Nutzer:innen architektonisch möglich bleibt, aber nichts im MVP darauf optimiert wird.

## 5. Kernkonzept: Die Pipeline

Der Wert liegt nicht in der Oberfläche, sondern in einer vierstufigen Pipeline:

```
Eingabe → 1. Erkennung → 2. Übersetzung → 3. Validierung → 4. Ausgabe
```

### 5.1 Erkennung (deterministisch + LLM-gestützt)

Vor der Übersetzung klassifiziert die App:

- **Quellsprache** (beliebig, Fokus zunächst Englisch)
- **Technik**: Häkeln oder Stricken
- **Bei Englisch zwingend: US- oder UK-Terminologie** (Heuristik: *single crochet* existiert nur in US-Terminologie; UK-Marker: *treble* ohne *double treble*-Kontext etc.)

Das Ergebnis wird **vor** der Übersetzung angezeigt („Erkannt: Englisch (US), Häkelanleitung“) und ist korrigierbar. Ein Klick mehr, aber er verhindert die schlimmste Fehlerklasse.

### 5.2 Übersetzung (Hybrid: LLM + Glossar-Leitplanken)

- Ein LLM übersetzt den Anleitungstext.
- Der Prompt enthält zwei feste Anker:
  1. **Quell-Glossar** für die häufigsten Sprachen (kuratiert, zunächst EN-US und EN-UK).
  2. **Striktes deutsches Ziel-Glossar** – die Ausgabeseite ist immer Deutsch, daher wird hier ein einziger Standard erzwungen (z. B. `fM`, `Lm`, `Stb`, `M`, `re`, `li`, `2 M re zsm`). Auch im Deutschen gibt es Wildwuchs; die App liefert immer dieselben Abkürzungen.
- Für nicht kuratierte Quellsprachen übersetzt das LLM frei, aber weiterhin mit hartem Ziel-Glossar – die Ausgabe bleibt dadurch konsistent.
- Strukturregeln im Prompt: Reihennummern, Klammern, Wiederholungen und Maschenzahlen dürfen nicht verändert, zusammengefasst oder „verschönert“ werden.

### 5.3 Validierung (deterministisch, sprachunabhängig)

- **Maschenzahl-Invariante:** Alle Zahlen im Original werden gegen alle Zahlen der Übersetzung abgeglichen (pro Zeile/Reihe). Zahlen dürfen sich beim Übersetzen nie ändern – außer bei bewusster Einheitenkonvertierung, die separat behandelt wird.
- **Strukturprüfung:** Gleiche Anzahl Reihen/Runden, Klammern paarig, Reihennummern lückenlos.
- Abweichungen führen nicht zum Abbruch, sondern zu einer **sichtbaren Markierung** der betroffenen Stelle.

### 5.4 Ausgabe

- Side-by-Side-Ansicht (Original | Deutsch), Zeilen synchronisiert.
- Deutsche Abkürzungslegende automatisch vorangestellt.
- **Einheitenkonvertierung**: Nadelstärken US → mm, inches → cm, Garngewichte mit deutscher Entsprechung (worsted ≈ Aran/dickes DK), Originalwert in Klammern.
- Export als Markdown/Text (Copy-Button reicht im MVP).

## 6. Funktionale Anforderungen (MVP)

| # | Anforderung | Prio |
|---|---|---|
| F1 | Text-Eingabe per Copy & Paste (Textfeld) | Must |
| F2 | Erkennung Sprache / Technik / US-UK mit Bestätigungsdialog | Must |
| F3 | Übersetzung mit Quell-Glossar (EN-US, EN-UK) und striktem DE-Ziel-Glossar | Must |
| F4 | Strukturerhalt (Reihen, Klammern, Wiederholungen, Maschenzahlen) | Must |
| F5 | Maschenzahl-Validierung mit Markierung von Abweichungen | Must |
| F6 | Einheitenkonvertierung (Nadeln, Maße, Garngewichte) | Must |
| F7 | Side-by-Side-Ansicht mit Legende | Must |
| F8 | Übersetzung beliebiger Quellsprachen (ohne kuratiertes Quell-Glossar) | Should |
| F9 | Export/Copy als Markdown | Should |
| F10 | PDF-Upload mit Textextraktion | Later (Phase 2) |

## 7. Qualitätskriterien / Definition of Done (MVP)

- Eine echte, gekaufte englische Anleitung (je 1× Häkeln, 1× Stricken, 1× US, 1× UK) kann **komplett nachgearbeitet werden, ohne ins Original schauen zu müssen**.
- Maschenzahlen zwischen Original und Übersetzung sind zu 100 % identisch (oder korrekt als Abweichung markiert).
- Zwei Anleitungen aus unterschiedlichen Quellen ergeben Übersetzungen mit **identischen deutschen Abkürzungen**.
- Eine UK-Anleitung wird nachweislich **nicht** mit US-Mapping übersetzt (Testfall: *double crochet*).

## 8. Roadmap

### Phase 0 – Durchstich (Wochenendprojekt)
> Ziel: Den Übersetzungskern validieren, bevor irgendetwas anderes gebaut wird.

- [ ] Einfache Web-App: Textfeld → Übersetzen-Button → Side-by-Side-Ausgabe
- [ ] LLM-Anbindung mit erstem Prompt (DE-Ziel-Glossar, Strukturregeln)
- [ ] Test mit 2–3 echten Anleitungen; Fehlerklassen dokumentieren

### Phase 1 – MVP „Vertrauenswürdig übersetzen“
> Ziel: Übersetzungen, denen man beim Arbeiten blind folgen kann.

- [ ] Erkennungsschritt (Sprache, Technik, US/UK) mit Bestätigungsdialog
- [ ] Kuratierte Glossare EN-US → DE und EN-UK → DE
- [ ] Striktes deutsches Ziel-Glossar + automatische Legende
- [ ] Maschenzahl- und Strukturvalidierung mit Markierungen
- [ ] Einheitenkonvertierung (Nadeln, Maße, Garngewichte)
- [ ] Export/Copy als Markdown

### Phase 2 – Quellen erweitern
> Ziel: „Egal woher die Anleitung kommt.“

- [ ] PDF-Upload (eingebetteter Text, kein OCR) – deckt Ravelry/Etsy-Käufe ab
- [ ] Web-Import per URL (Parsing von Blog-Anleitungen)
- [ ] Foto-Upload mit OCR (härteste Variante; OCR-Fehler bei Abkürzungen wie `sl st` vs. `st st` gezielt abfangen)
- [ ] Weitere kuratierte Quell-Glossare nach Bedarf (NL, DK, FR, …)

### Phase 3 – Begleitmodus
> Ziel: Von „Übersetzer“ zu „Arbeitsbegleiter“.

- [ ] Bibliothek gespeicherter, übersetzter Anleitungen
- [ ] Reihenzähler mit Fortschritt pro Anleitung
- [ ] Hervorhebung der aktuellen Reihe, Schritt-für-Schritt-Modus
- [ ] Sprachsteuerung („nächste Reihe“) – beim Häkeln ist keine Hand frei

### Phase 4 – Ausblick
- [ ] Zählmuster/Charts (strukturierte Tabellen)
- [ ] Japanische Symbol-Diagramme (Bilderkennung; Symbole sind international genormt)
- [ ] Ggf. Öffnung für andere Nutzer:innen (dann: Copyright-Konzept, Accounts)

## 9. Risiken & Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| LLM halluziniert / ändert Zahlen | Unbrauchbares Werkstück, Ribbeln | Deterministische Maschenzahl-Validierung (5.3), Side-by-Side-Kontrolle |
| US/UK-Fehlklassifikation | Systematisch falsche Maschen | Expliziter Bestätigungsschritt vor Übersetzung (5.1) |
| Deutscher Abkürzungs-Wildwuchs | Inkonsistente Ausgaben | Hartes Ziel-Glossar, Legende in jeder Ausgabe |
| OCR-Fehler bei Abkürzungen (Phase 2) | Falsche Maschen aus einem Buchstaben Unterschied | OCR-Nachkorrektur gegen Glossar, Konfidenz-Markierung |
| Copyright beim Teilen | Rechtliches Risiko | MVP strikt privat; Teilen ist explizites Nicht-Ziel |

## 10. Offene Fragen

- Welches LLM/welcher Anbieter für den Übersetzungskern? (Kriterien: Instruktionstreue bei Strukturregeln, Kosten pro Anleitung)
- Zeilenweise vs. abschnittsweise Übersetzung – was liefert die stabilere Struktur-Synchronisation für die Side-by-Side-Ansicht?
- Wie werden Größenvarianten behandelt (Anleitungen mit S/M/L-Klammern wie `(4, 6, 8)`), damit die Zahlen-Validierung nicht fehlschlägt?
- Lokale Speicherung der Bibliothek (Phase 3): Datei-basiert oder Browser-Storage oder Backend?

## 11. Anhang: Glossar-Auszug (Beispiel)

| EN (US) | EN (UK) | Deutsch (Ziel-Standard) |
|---|---|---|
| ch (chain) | ch (chain) | Lm (Luftmasche) |
| sc (single crochet) | dc (double crochet) | fM (feste Masche) |
| hdc (half double crochet) | htr (half treble) | hStb (halbes Stäbchen) |
| dc (double crochet) | tr (treble) | Stb (Stäbchen) |
| sl st (slip stitch) | ss (slip stitch) | Km (Kettmasche) |
| k (knit) | k (knit) | re (rechts) |
| p (purl) | p (purl) | li (links) |
| k2tog | k2tog | 2 M re zsm (2 Maschen rechts zusammenstricken) |
| yo (yarn over) | yo/yfwd | U (Umschlag) |
| st(s) | st(s) | M (Masche/n) |

*Hinweis: Das vollständige Glossar wird als eigene Datei (`glossary/`) im Repo gepflegt und ist die zentrale Wahrheitsquelle für Prompt und Validierung.*
