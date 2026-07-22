<script lang="ts">
	import type { UebersetzungsErgebnis } from '$lib/types';

	let eingabe = $state('');
	let laedt = $state(false);
	let fehler = $state<string | null>(null);
	let ergebnis = $state<UebersetzungsErgebnis | null>(null);

	async function uebersetzen() {
		const text = eingabe.trim();
		if (!text || laedt) return;

		laedt = true;
		fehler = null;
		ergebnis = null;

		try {
			const res = await fetch('/api/translate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ text })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? `Fehler ${res.status}`);
			}

			ergebnis = (await res.json()) as UebersetzungsErgebnis;
		} catch (e) {
			fehler = e instanceof Error ? e.message : 'Unbekannter Fehler.';
		} finally {
			laedt = false;
		}
	}
</script>

<svelte:head>
	<title>Maschinell – Anleitungen übersetzen</title>
</svelte:head>

<main>
	<header>
		<h1>🧶 Maschinell</h1>
		<p class="claim">
			Häkel- und Strickanleitungen aus jeder Sprache in einheitliches Deutsch.
		</p>
	</header>

	<section class="eingabe">
		<label for="anleitung">Anleitung einfügen</label>
		<textarea
			id="anleitung"
			bind:value={eingabe}
			rows="10"
			placeholder="Row 1: sc in 2nd ch from hook, sc across (12)&#10;Row 2: ch 1, turn, sc across (12)&#10;..."
			disabled={laedt}
		></textarea>
		<button onclick={uebersetzen} disabled={laedt || !eingabe.trim()}>
			{laedt ? 'Übersetze …' : 'Übersetzen'}
		</button>
	</section>

	{#if fehler}
		<p class="fehler" role="alert">{fehler}</p>
	{/if}

	{#if ergebnis}
		<section class="ergebnis">
			<div class="meta">
				<span
					>Erkannt: <strong>{ergebnis.quelle.sprache}</strong>
					{#if ergebnis.quelle.terminologie && ergebnis.quelle.terminologie !== 'n/a'}
						({ergebnis.quelle.terminologie})
					{/if}
					· {ergebnis.quelle.technik}</span
				>
				{#if ergebnis.abweichungen > 0}
					<span class="warnung"
						>⚠ {ergebnis.abweichungen} Reihe(n) mit Maschenzahl-Abweichung</span
					>
				{:else}
					<span class="ok">✓ Maschenzahlen stimmig</span>
				{/if}
			</div>

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
							{reihe.deutsch}
							{#if !reihe.pruefung.ok}
								<span
									class="marker"
									title="Maschenzahlen weichen ab: Original {reihe.pruefung.zahlenOriginal.join(
										', '
									) || '–'} / Deutsch {reihe.pruefung.zahlenDeutsch.join(', ') || '–'}"
									>⚠</span
								>
							{/if}
						</div>
					</div>
				{/each}
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

	.eingabe {
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
		align-self: flex-start;
		padding: 0.6rem 1.4rem;
		border: none;
		border-radius: 8px;
		background: #b5533a;
		color: #fff;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.fehler {
		margin-top: 1.25rem;
		padding: 0.75rem 1rem;
		background: #fdecea;
		border: 1px solid #f5c6c0;
		border-radius: 8px;
		color: #a12a1a;
	}

	.ergebnis {
		margin-top: 2rem;
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

	.meta .warnung {
		color: #a35a00;
		font-weight: 600;
	}

	.meta .ok {
		color: #3a7d44;
		font-weight: 600;
	}

	.legende {
		margin-bottom: 1.5rem;
		padding: 0.5rem 0.75rem;
		background: #fff;
		border: 1px solid #e7e0d6;
		border-radius: 8px;
	}

	.legende summary {
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
