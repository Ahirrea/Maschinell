# 🧶 Maschinell

**Übersetzt Häkel- und Strickanleitungen aus jeder Sprache in einheitliches Deutsch – mit Fachglossar, Strukturerhalt und automatischer Maschenzahl-Prüfung.**

> *Maschinell* = **Masche** + maschinell. Weil generische Übersetzer an `sc`, `k2tog` und dem US/UK-Terminologie-Chaos scheitern.

## Warum?

Ein *double crochet* ist in US-Anleitungen ein Stäbchen, in UK-Anleitungen eine feste Masche. DeepL & Co. wissen das nicht – und ein Übersetzungsfehler in Reihe 12 bedeutet 30 Reihen später: ribbeln. Maschinell übersetzt terminologie-bewusst, erhält die Struktur der Anleitung exakt und prüft automatisch, dass keine Maschenzahl verloren geht.

## Kernidee

```
Eingabe → Erkennung (Sprache, Technik, US/UK) → LLM-Übersetzung mit Glossar-Ankern
        → Zahlen- & Strukturvalidierung → Side-by-Side-Ausgabe mit DE-Legende
```

- **Beliebige Quellsprache, ein Ziel:** standardisiertes Deutsch mit einheitlichen Abkürzungen (fM, Lm, Stb, re, li …)
- **Vertrauen durch Prüfung:** Maschenzahlen dürfen sich beim Übersetzen nie ändern – das wird deterministisch validiert
- **Einheiten inklusive:** Nadelstärken US → mm, inches → cm, Garngewichte

## Status & Roadmap

🚧 In Entwicklung – aktuell Phase 1 (MVP „Vertrauenswürdig übersetzen“): Erkennung mit Bestätigungsdialog, kuratierte EN-US/EN-UK-Glossare, Maschenzahl- und Strukturvalidierung, Einheitenkonvertierung und Markdown-Export.

| Phase | Ziel |
|---|---|
| **0 – Durchstich** | Text einfügen → übersetzen → Side-by-Side |
| **1 – MVP** | Erkennung, Glossare (EN-US/UK), Validierung, Einheiten |
| **2 – Quellen** | PDF-Upload, Web-Import, Foto/OCR, weitere Sprachen |
| **3 – Begleitmodus** | Bibliothek, Reihenzähler, Sprachsteuerung |
| **4 – Ausblick** | Charts/Zählmuster, japanische Symbol-Diagramme |

Details im [PRD](./PRD.md).

## Hinweis zu Anleitungen & Urheberrecht

Maschinell ist für die **private Übersetzung selbst gekaufter Anleitungen** gedacht. Das Teilen oder Veröffentlichen übersetzter Anleitungen ist kein Ziel dieses Projekts.
