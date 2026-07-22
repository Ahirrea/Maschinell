<script lang="ts">
	// Clientseitige Glossar-Referenz: zeigt die kuratierten Zuordnungen
	// EN-US | EN-UK → DE (Ziel-Standard) aus derselben Quelle, die auch Prompt
	// und Validierung speist (data.ts). Keine API nötig – reines Nachschlagen.
	import { HAEKELN, STRICKEN, type GlossarZeile } from '$lib/glossary/data';

	let suche = $state('');

	function filtere(zeilen: GlossarZeile[], q: string): GlossarZeile[] {
		const s = q.trim().toLowerCase();
		if (!s) return zeilen;
		return zeilen.filter((z) =>
			[z.us, z.uk, z.de, z.bedeutung].some((f) => f.toLowerCase().includes(s))
		);
	}

	const haekeln = $derived(filtere(HAEKELN, suche));
	const stricken = $derived(filtere(STRICKEN, suche));
	const treffer = $derived(haekeln.length + stricken.length);
</script>

<svelte:head>
	<title>Maschinell – Glossar</title>
</svelte:head>

<main>
	<nav class="topnav">
		<a href="/">← Übersetzen</a>
	</nav>

	<header>
		<h1>Glossar</h1>
		<p class="claim">
			Der einheitliche deutsche Ziel-Standard und seine englischen Entsprechungen (US/UK). Dieselbe
			Quelle, die auch Übersetzung und Validierung steuert.
		</p>
	</header>

	<div class="suchfeld">
		<label for="suche">Suchen</label>
		<input
			id="suche"
			type="search"
			bind:value={suche}
			placeholder="z. B. Stäbchen, dc, k2tog, Umschlag …"
		/>
		{#if suche.trim()}
			<span class="anzahl">{treffer} Treffer</span>
		{/if}
	</div>

	{#if treffer === 0}
		<p class="leer">Keine Einträge für „{suche}“.</p>
	{/if}

	{#if haekeln.length > 0}
		<section>
			<h2>Häkeln</h2>
			{@render tabelle(haekeln)}
		</section>
	{/if}

	{#if stricken.length > 0}
		<section>
			<h2>Stricken</h2>
			{@render tabelle(stricken)}
		</section>
	{/if}
</main>

{#snippet tabelle(zeilen: GlossarZeile[])}
	<div class="tabelle" role="table">
		<div class="kopf" role="row">
			<div role="columnheader">EN (US)</div>
			<div role="columnheader">EN (UK)</div>
			<div role="columnheader">Deutsch</div>
			<div role="columnheader">Bedeutung</div>
		</div>
		{#each zeilen as z (z.de + z.us)}
			<div class="zeile" role="row">
				<div class="mono" role="cell">{z.us}</div>
				<div class="mono" role="cell">{z.uk}</div>
				<div class="de" role="cell">{z.de}</div>
				<div role="cell">{z.bedeutung}</div>
			</div>
		{/each}
	</div>
{/snippet}

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

	.topnav {
		margin-bottom: 1rem;
	}

	.topnav a {
		color: #b5533a;
		text-decoration: none;
		font-weight: 600;
	}

	.topnav a:hover {
		text-decoration: underline;
	}

	header h1 {
		margin: 0 0 0.25rem;
		font-size: 2rem;
	}

	.claim {
		margin: 0 0 1.5rem;
		color: #6b6156;
	}

	.suchfeld {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.suchfeld label {
		font-weight: 600;
	}

	.suchfeld input {
		flex: 1;
		min-width: 220px;
		padding: 0.55rem 0.7rem;
		border: 1px solid #d9d2c8;
		border-radius: 8px;
		background: #fff;
		font-size: 0.95rem;
	}

	.anzahl {
		font-size: 0.85rem;
		color: #6b6156;
	}

	.leer {
		color: #6b6156;
	}

	section {
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1.15rem;
		margin: 0 0 0.75rem;
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
		grid-template-columns: 1.2fr 1.2fr 0.8fr 1.6fr;
	}

	.kopf {
		background: #f1ece4;
		font-weight: 600;
		font-size: 0.85rem;
	}

	.kopf > div,
	.zeile > div {
		padding: 0.6rem 0.8rem;
		border-bottom: 1px solid #efe9e0;
	}

	.kopf > div + div,
	.zeile > div + div {
		border-left: 1px solid #efe9e0;
	}

	.zeile:last-child > div {
		border-bottom: none;
	}

	.mono {
		font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
		font-size: 0.82rem;
		color: #6b6156;
	}

	.de {
		font-weight: 700;
	}

	@media (max-width: 640px) {
		.kopf {
			display: none;
		}
		.zeile {
			grid-template-columns: 1fr;
			padding: 0.35rem 0;
		}
		.zeile > div {
			border-bottom: none;
			padding: 0.2rem 0.8rem;
		}
		.zeile > div + div {
			border-left: none;
		}
		.zeile {
			border-bottom: 1px solid #efe9e0;
		}
		.mono::before {
			content: 'EN: ';
			color: #a89c8c;
		}
		.de::before {
			content: 'DE: ';
			font-weight: 400;
			color: #a89c8c;
		}
	}
</style>
