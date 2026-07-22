<script lang="ts">
	import type { Erkennung, Technik, Terminologie, UebersetzungsErgebnis } from '$lib/types';
	import { alsMarkdown } from '$lib/markdown';

	// Pipeline als Wizard: Eingabe → Erkennung bestätigen → Ergebnis.
	type Schritt = 'eingabe' | 'bestaetigung' | 'ergebnis';
	let schritt = $state<Schritt>('eingabe');

	let eingabe = $state('');
	let laedt = $state(false);
	let fehler = $state<string | null>(null);

	// Editierbare (korrigierbare) Erkennung – der Bestätigungsschritt ist Pflicht.
	let erkennung = $state<Erkennung | null>(null);
	let groesseIndex = $state<number | null>(null);

	let ergebnis = $state<UebersetzungsErgebnis | null>(null);
	let kopiert = $state(false);

	const TECHNIKEN: Technik[] = ['Häkeln', 'Stricken', 'Unbekannt'];
	const TERMINOLOGIEN: Terminologie[] = ['US', 'UK', 'unklar', 'n/a'];

	async function analysieren() {
		const text = eingabe.trim();
		if (!text || laedt) return;

		laedt = true;
		fehler = null;
		ergebnis = null;

		try {
			const res = await fetch('/api/detect', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ text })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? `Fehler ${res.status}`);
			}
			erkennung = (await res.json()) as Erkennung;
			// Vorauswahl: erste Größe, falls Mehrgrößen-Anleitung.
			groesseIndex = erkennung.groessen.length > 0 ? 0 : null;
			schritt = 'bestaetigung';
		} catch (e) {
			fehler = e instanceof Error ? e.message : 'Unbekannter Fehler.';
		} finally {
			laedt = false;
		}
	}

	async function uebersetzen() {
		const text = eingabe.trim();
		if (!text || !erkennung || laedt) return;

		laedt = true;
		fehler = null;

		try {
			const res = await fetch('/api/translate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ text, erkennung, groesseIndex })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? `Fehler ${res.status}`);
			}
			ergebnis = (await res.json()) as UebersetzungsErgebnis;
			schritt = 'ergebnis';
		} catch (e) {
			fehler = e instanceof Error ? e.message : 'Unbekannter Fehler.';
		} finally {
			laedt = false;
		}
	}

	function zurueckZurEingabe() {
		schritt = 'eingabe';
		fehler = null;
	}

	function neu() {
		schritt = 'eingabe';
		eingabe = '';
		erkennung = null;
		groesseIndex = null;
		ergebnis = null;
		fehler = null;
	}

	// ── Ausgabe-Helfer ────────────────────────────────────────────────────────

	type Segment = { typ: 'text'; wert: string } | { typ: 'tupel'; teile: string[] };

	/**
	 * Zerlegt die deutsche Anzeige in Text und Größen-Tupel. Nur Klammer-Gruppen
	 * mit genau so vielen Komma-Teilen wie erkannten Größen (>1) gelten als
	 * Größen-Tupel – so wird die gewählte Größe hervorgehoben, einzelne
	 * Maschenzahlen wie "(12)" aber nicht.
	 */
	function segmentiere(text: string, anzahlGroessen: number): Segment[] {
		if (anzahlGroessen < 2) return [{ typ: 'text', wert: text }];
		const segmente: Segment[] = [];
		const regex = /\(([^()]*\d[^()]*)\)/g;
		let letzterIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = regex.exec(text)) !== null) {
			const teile = m[1].split(',').map((t) => t.trim());
			if (teile.length !== anzahlGroessen) continue;
			if (m.index > letzterIndex) {
				segmente.push({ typ: 'text', wert: text.slice(letzterIndex, m.index) });
			}
			segmente.push({ typ: 'tupel', teile });
			letzterIndex = regex.lastIndex;
		}
		if (letzterIndex < text.length) {
			segmente.push({ typ: 'text', wert: text.slice(letzterIndex) });
		}
		return segmente.length > 0 ? segmente : [{ typ: 'text', wert: text }];
	}

	async function kopieren() {
		if (!ergebnis) return;
		try {
			await navigator.clipboard.writeText(alsMarkdown(ergebnis));
			kopiert = true;
			setTimeout(() => (kopiert = false), 2000);
		} catch {
			fehler = 'Kopieren nicht möglich – bitte manuell markieren.';
		}
	}

	function herunterladen() {
		if (!ergebnis) return;
		const blob = new Blob([alsMarkdown(ergebnis)], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'maschinell-uebersetzung.md';
		a.click();
		URL.revokeObjectURL(url);
	}

	const gewaehlteGroesse = $derived(
		ergebnis && ergebnis.groesseIndex !== null
			? ergebnis.erkennung.groessen.find((g) => g.index === ergebnis!.groesseIndex)
			: undefined
	);
	const strukturOk = $derived(
		ergebnis ? ergebnis.struktur.klammernPaarig && ergebnis.struktur.reihenLueckenlos : true
	);
</script>

<svelte:head>
	<title>Maschinell – Anleitungen übersetzen</title>
</svelte:head>

<main>
	<header>
		<h1>🧶 Maschinell</h1>
		<p class="claim">Häkel- und Strickanleitungen aus jeder Sprache in einheitliches Deutsch.</p>
	</header>

	<ol class="stufen" aria-label="Fortschritt">
		<li class:aktiv={schritt === 'eingabe'} class:erledigt={schritt !== 'eingabe'}>1 · Eingabe</li>
		<li
			class:aktiv={schritt === 'bestaetigung'}
			class:erledigt={schritt === 'ergebnis'}
		>
			2 · Erkennung bestätigen
		</li>
		<li class:aktiv={schritt === 'ergebnis'}>3 · Übersetzung</li>
	</ol>

	{#if fehler}
		<p class="fehler" role="alert">{fehler}</p>
	{/if}

	<!-- Schritt 1: Eingabe -->
	{#if schritt === 'eingabe'}
		<section class="eingabe">
			<label for="anleitung">Anleitung einfügen</label>
			<textarea
				id="anleitung"
				bind:value={eingabe}
				rows="10"
				placeholder="Row 1: sc in 2nd ch from hook, sc across (12)&#10;Row 2: ch 1, turn, sc across (12)&#10;..."
				disabled={laedt}
			></textarea>
			<button class="primaer" onclick={analysieren} disabled={laedt || !eingabe.trim()}>
				{laedt ? 'Analysiere …' : 'Analysieren'}
			</button>
		</section>
	{/if}

	<!-- Schritt 2: Erkennung bestätigen -->
	{#if schritt === 'bestaetigung' && erkennung}
		<section class="bestaetigung">
			<p class="hinweis">
				Bitte die Erkennung prüfen. <strong>US/UK-Fehler sind die schlimmste Fehlerklasse</strong> –
				ein falsch erkannter Dialekt macht jede Masche systematisch falsch.
			</p>

			<div class="felder">
				<div class="feld">
					<label for="sprache">Sprache</label>
					<input id="sprache" type="text" bind:value={erkennung.sprache} />
				</div>

				<div class="feld">
					<label for="technik">Technik</label>
					<select id="technik" bind:value={erkennung.technik}>
						{#each TECHNIKEN as t (t)}
							<option value={t}>{t}</option>
						{/each}
					</select>
				</div>

				<div class="feld">
					<label for="terminologie">Terminologie</label>
					<select
						id="terminologie"
						bind:value={erkennung.terminologie}
						class:warn={erkennung.terminologie === 'unklar'}
					>
						{#each TERMINOLOGIEN as t (t)}
							<option value={t}>{t}</option>
						{/each}
					</select>
				</div>
			</div>

			{#if erkennung.begruendung}
				<p class="begruendung"><span>Begründung:</span> {erkennung.begruendung}</p>
			{/if}

			{#if erkennung.terminologie === 'unklar'}
				<p class="warnbox">
					⚠ Die Terminologie ist unklar. Bitte US oder UK wählen, bevor du übersetzt.
				</p>
			{/if}

			{#if erkennung.groessen.length > 0}
				<fieldset class="groessen">
					<legend>Größe wählen (wird im Ergebnis hervorgehoben)</legend>
					<div class="groessen-optionen">
						{#each erkennung.groessen as g (g.index)}
							<label class="groesse-option" class:gewaehlt={groesseIndex === g.index}>
								<input type="radio" name="groesse" value={g.index} bind:group={groesseIndex} />
								{g.name}
							</label>
						{/each}
					</div>
					<p class="mini">Alle Größen bleiben erhalten; nur die Anzeige hebt die gewählte hervor.</p>
				</fieldset>
			{/if}

			<div class="aktionen">
				<button class="sekundaer" onclick={zurueckZurEingabe} disabled={laedt}>Zurück</button>
				<button class="primaer" onclick={uebersetzen} disabled={laedt}>
					{laedt ? 'Übersetze …' : 'Übersetzen'}
				</button>
			</div>
		</section>
	{/if}

	<!-- Schritt 3: Ergebnis -->
	{#if schritt === 'ergebnis' && ergebnis}
		<section class="ergebnis">
			<div class="meta">
				<span
					>Erkannt: <strong>{ergebnis.erkennung.sprache}</strong>
					{#if ergebnis.erkennung.terminologie && ergebnis.erkennung.terminologie !== 'n/a'}
						({ergebnis.erkennung.terminologie})
					{/if}
					· {ergebnis.erkennung.technik}</span
				>
				{#if gewaehlteGroesse}
					<span class="badge">Größe {gewaehlteGroesse.name}</span>
				{/if}
				{#if ergebnis.abweichungen > 0}
					<span class="warnung">⚠ {ergebnis.abweichungen} Reihe(n) mit Maschenzahl-Abweichung</span>
				{:else}
					<span class="ok">✓ Maschenzahlen stimmig</span>
				{/if}
				{#if strukturOk}
					<span class="ok">✓ Struktur stimmig</span>
				{:else}
					<span class="warnung">⚠ Struktur-Hinweise</span>
				{/if}
			</div>

			{#if !strukturOk}
				<ul class="strukturprobleme">
					{#each ergebnis.struktur.probleme as p, i (i)}
						<li>{p}</li>
					{/each}
				</ul>
			{/if}

			{#if ergebnis.legende.length > 0}
				<details class="legende" open>
					<summary>Legende ({ergebnis.legende.length})</summary>
					<dl>
						{#each ergebnis.legende as eintrag (eintrag.abk)}
							<div>
								<dt>{eintrag.abk}</dt>
								<dd>{eintrag.bedeutung}</dd>
							</div>
						{/each}
					</dl>
				</details>
			{/if}

			<div class="tabelle" role="table" aria-label="Original und Übersetzung">
				<div class="kopf" role="row">
					<div role="columnheader">Original</div>
					<div role="columnheader">Deutsch</div>
				</div>
				{#each ergebnis.reihen as reihe (reihe.index)}
					<div class="zeile" class:abweichung={!reihe.pruefung.ok} role="row">
						<div class="original" role="cell">{reihe.original}</div>
						<div class="deutsch" role="cell">
							{#each segmentiere(reihe.deutschAnzeige, ergebnis.erkennung.groessen.length) as seg, i (i)}
								{#if seg.typ === 'text'}{seg.wert}{:else}(<!--
										-->{#each seg.teile as teil, ti (ti)}<!--
											--><span class:gewaehlt={ti === ergebnis.groesseIndex}>{teil}</span
											>{#if ti < seg.teile.length - 1}, {/if}<!--
										-->{/each}<!--
									-->){/if}
							{/each}
							{#if !reihe.pruefung.ok}
								<span
									class="marker"
									title="Maschenzahlen weichen ab: Original {reihe.pruefung.zahlenOriginal.join(
										', '
									) || '–'} / Deutsch {reihe.pruefung.zahlenDeutsch.join(', ') || '–'}">⚠</span
								>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			{#if ergebnis.konvertierungen.length > 0}
				<details class="konvertierungen" open>
					<summary>Einheitenumrechnung ({ergebnis.konvertierungen.length})</summary>
					<ul>
						{#each ergebnis.konvertierungen as k, i (i)}
							<li><span class="von">{k.original}</span> → <strong>{k.konvertiert}</strong></li>
						{/each}
					</ul>
				</details>
			{/if}

			<div class="aktionen">
				<button class="sekundaer" onclick={neu}>Neue Anleitung</button>
				<button class="sekundaer" onclick={kopieren}>
					{kopiert ? '✓ Kopiert' : 'Als Markdown kopieren'}
				</button>
				<button class="primaer" onclick={herunterladen}>Als .md herunterladen</button>
			</div>
		</section>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			sans-serif;
		background: #faf8f5;
		color: #2a2622;
	}

	main {
		max-width: 960px;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}

	header h1 {
		margin: 0 0 0.25rem;
		font-size: 2rem;
	}

	.claim {
		margin: 0 0 1.5rem;
		color: #6b6156;
	}

	.stufen {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		list-style: none;
		margin: 0 0 1.5rem;
		padding: 0;
		font-size: 0.85rem;
	}

	.stufen li {
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		background: #f1ece4;
		color: #8a7f72;
	}

	.stufen li.aktiv {
		background: #b5533a;
		color: #fff;
		font-weight: 600;
	}

	.stufen li.erledigt {
		background: #e6ddd0;
		color: #6b6156;
	}

	.eingabe,
	.bestaetigung {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	label {
		font-weight: 600;
	}

	textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 0.75rem;
		border: 1px solid #d9d2c8;
		border-radius: 8px;
		font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
		font-size: 0.9rem;
		resize: vertical;
		background: #fff;
	}

	button {
		padding: 0.6rem 1.4rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	button.primaer {
		background: #b5533a;
		color: #fff;
	}

	button.sekundaer {
		background: #efe9e0;
		color: #4a423a;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.eingabe button {
		align-self: flex-start;
	}

	.aktionen {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.fehler {
		margin: 1.25rem 0;
		padding: 0.75rem 1rem;
		background: #fdecea;
		border: 1px solid #f5c6c0;
		border-radius: 8px;
		color: #a12a1a;
	}

	/* Bestätigungsschritt */
	.hinweis {
		margin: 0;
		color: #6b6156;
	}

	.felder {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.feld {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.feld input,
	.feld select {
		padding: 0.55rem 0.6rem;
		border: 1px solid #d9d2c8;
		border-radius: 8px;
		background: #fff;
		font-size: 0.95rem;
	}

	select.warn {
		border-color: #d98a00;
		background: #fff8ec;
	}

	.begruendung {
		margin: 0;
		font-size: 0.9rem;
		color: #6b6156;
	}

	.begruendung span {
		font-weight: 600;
	}

	.warnbox {
		margin: 0;
		padding: 0.65rem 0.9rem;
		background: #fff8ec;
		border: 1px solid #f0d29a;
		border-radius: 8px;
		color: #8a5a00;
		font-weight: 600;
	}

	.groessen {
		border: 1px solid #e7e0d6;
		border-radius: 8px;
		padding: 0.75rem 1rem 1rem;
		margin: 0;
	}

	.groessen legend {
		font-weight: 600;
		padding: 0 0.35rem;
	}

	.groessen-optionen {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.groesse-option {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.8rem;
		border: 1px solid #d9d2c8;
		border-radius: 999px;
		background: #fff;
		font-weight: 500;
		cursor: pointer;
	}

	.groesse-option.gewaehlt {
		border-color: #b5533a;
		background: #fbeee9;
		font-weight: 700;
	}

	.mini {
		margin: 0.75rem 0 0;
		font-size: 0.8rem;
		color: #8a7f72;
	}

	/* Ergebnis */
	.ergebnis {
		margin-top: 1rem;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		align-items: center;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		color: #6b6156;
	}

	.meta .badge {
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		background: #fbeee9;
		border: 1px solid #e6c3b7;
		color: #8a3a24;
		font-weight: 600;
	}

	.meta .warnung {
		color: #a35a00;
		font-weight: 600;
	}

	.meta .ok {
		color: #3a7d44;
		font-weight: 600;
	}

	.strukturprobleme {
		margin: 0 0 1rem;
		padding: 0.65rem 1rem 0.65rem 2rem;
		background: #fff8ec;
		border: 1px solid #f0d29a;
		border-radius: 8px;
		color: #8a5a00;
		font-size: 0.9rem;
	}

	.legende,
	.konvertierungen {
		margin-bottom: 1.5rem;
		padding: 0.5rem 0.75rem;
		background: #fff;
		border: 1px solid #e7e0d6;
		border-radius: 8px;
	}

	.legende summary,
	.konvertierungen summary {
		cursor: pointer;
		font-weight: 600;
	}

	.legende dl {
		margin: 0.75rem 0 0.25rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.35rem 1rem;
	}

	.legende dl > div {
		display: flex;
		gap: 0.5rem;
	}

	.legende dt {
		font-weight: 700;
		min-width: 3.5em;
	}

	.legende dd {
		margin: 0;
		color: #6b6156;
	}

	.konvertierungen ul {
		margin: 0.75rem 0 0.25rem;
		padding-left: 1.2rem;
		font-size: 0.9rem;
	}

	.konvertierungen .von {
		font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
		color: #6b6156;
	}

	.tabelle {
		border: 1px solid #e7e0d6;
		border-radius: 8px;
		overflow: hidden;
		background: #fff;
	}

	.kopf,
	.zeile {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.kopf {
		background: #f1ece4;
		font-weight: 600;
	}

	.kopf > div,
	.zeile > div {
		padding: 0.65rem 0.85rem;
		border-bottom: 1px solid #efe9e0;
	}

	.kopf > div:first-child,
	.zeile > div:first-child {
		border-right: 1px solid #efe9e0;
	}

	.zeile:last-child > div {
		border-bottom: none;
	}

	.original {
		font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
		font-size: 0.85rem;
		color: #6b6156;
		white-space: pre-wrap;
	}

	.deutsch {
		white-space: pre-wrap;
	}

	/* Hervorhebung der gewählten Größe innerhalb der Klammer-Tupel */
	.deutsch span.gewaehlt {
		font-weight: 700;
		color: #b5533a;
		background: #fbeee9;
		border-radius: 3px;
		padding: 0 0.15rem;
	}

	.zeile.abweichung {
		background: #fff8ec;
	}

	.marker {
		margin-left: 0.35rem;
		color: #a35a00;
		cursor: help;
	}

	@media (max-width: 640px) {
		.kopf,
		.zeile {
			grid-template-columns: 1fr;
		}
		.kopf > div:first-child,
		.zeile > div:first-child {
			border-right: none;
		}
	}
</style>
