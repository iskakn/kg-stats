<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import type { IndicatorFull } from '#lib/server/worldbank';
	import { SvelteMap } from 'svelte/reactivity';
	import StatChart from '#lib/components/StatChart.svelte';
	import IndicatorStatsCards from '#lib/components/IndicatorStatsCards.svelte';
	import FeaturedMacroGrid from '#lib/components/FeaturedMacroGrid.svelte';
	import IndicatorExplorer from '#lib/components/IndicatorExplorer.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import IndicatorMetadata from '#lib/components/IndicatorMetadata.svelte';
	import DisclaimerModal from '#lib/components/DisclaimerModal.svelte';

	let { data }: { data: PageData } = $props();

	let disclaimerModalRef = $state<{ openModal: () => void } | null>(null);

	// In-memory client cache
	const clientCache = new SvelteMap<string, IndicatorFull>();

	let selectedIndicator = $state<IndicatorFull | null>(null);
	let currentIndicator = $derived(selectedIndicator ?? data.initialIndicator);

	let isLoading = $state(false);
	let activeTab = $state<'chart' | 'table' | 'meta'>('chart');

	let isCopied = $state(false);

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const initialCode = params.get('indicator');
		if (initialCode && initialCode !== currentIndicator.code) {
			selectIndicator(initialCode);
		}
	});

	function updateUrlQuery(code: string) {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (code === 'NY.GDP.MKTP.CD') {
			url.searchParams.delete('indicator');
		} else {
			url.searchParams.set('indicator', code);
		}
		window.history.replaceState({}, '', url.toString());
	}

	async function copyShareUrl() {
		if (typeof window === 'undefined') return;
		try {
			await navigator.clipboard.writeText(window.location.href);
			isCopied = true;
			setTimeout(() => {
				isCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	}

	async function selectIndicator(code: string) {
		if (currentIndicator.code === code) return;

		updateUrlQuery(code);

		if (clientCache.has(code)) {
			selectedIndicator = clientCache.get(code)!;
			scrollToViz();
			return;
		}

		const preloaded =
			data.featured.find((f: IndicatorFull) => f.code === code) ||
			(data.initialIndicator.code === code ? data.initialIndicator : null);

		if (preloaded) {
			clientCache.set(code, preloaded);
			selectedIndicator = preloaded;
			scrollToViz();
			return;
		}

		isLoading = true;
		try {
			const res = await fetch(resolve('/api/indicator/[code]', { code }));
			if (res.ok) {
				const ind: IndicatorFull = await res.json();
				clientCache.set(code, ind);
				selectedIndicator = ind;
				scrollToViz();
			}
		} catch (err) {
			console.error('Failed to load indicator:', err);
		} finally {
			isLoading = false;
		}
	}

	function scrollToViz() {
		const el = document.getElementById('visualization-stage');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function scrollToDirectory() {
		const el = document.getElementById('indicator-archive');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

<svelte:head>
	<title>{data.countryName} Statistics — World Bank Open Data</title>
	<meta
		name="description"
		content="Macroeconomic and demographic indicators for {data.countryName} from World Bank open data."
	/>
</svelte:head>

<main class="min-h-screen bg-base-200 text-base-content antialiased pb-20">
	<!-- Top Header (Single Clean Theme, No switcher) -->
	<header class="border-b border-base-300 bg-base-100 sticky top-0 z-30">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="w-8 h-8 rounded bg-primary text-primary-content flex items-center justify-center font-bold text-xs tracking-wider"
				>
					{data.countryCode.slice(0, 3)}
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h1 class="text-sm sm:text-base font-bold tracking-tight text-base-content">
							{data.countryName.toUpperCase()} STATS
						</h1>
						<span class="text-[11px] font-medium text-base-content/60 hidden sm:inline">
							• World Bank Open Data
						</span>
					</div>
					<p class="text-[11px] text-base-content/60">
						World Development Indicators (WDI) • {data.totalCount.toLocaleString()} in-memory stats
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					class="btn btn-xs sm:btn-sm btn-ghost text-xs text-base-content/70 hover:text-base-content"
					onclick={() => disclaimerModalRef?.openModal()}
					title="Read AI generation disclaimer and data provenance"
				>
					⚠️ Disclaimer
				</button>
				<button
					type="button"
					class="btn btn-xs sm:btn-sm btn-outline border-base-300 text-xs font-normal"
					onclick={scrollToDirectory}
				>
					🔍 Browse Archive ({data.catalog.length})
				</button>
			</div>
		</div>
	</header>

	<DisclaimerModal bind:this={disclaimerModalRef} />

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
		<!-- Section 1: Essential Core Indicators -->
		<section class="space-y-4">
			<div
				class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-base-300 pb-3"
			>
				<div>
					<div
						class="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-semibold mb-1"
					>
						<span>{data.countryName}</span>
						<span>•</span>
						<span>8 Essential Indicators</span>
					</div>
					<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-base-content">
						Core Macroeconomic & Demographic Metrics
					</h2>
					<p class="text-xs text-base-content/60 mt-0.5">
						Primary statistical indicators defining the macroeconomic health and development of {data.countryName}.
					</p>
				</div>
				<span class="text-xs text-base-content/50 font-mono hidden sm:inline">
					Click card to inspect
				</span>
			</div>

			<FeaturedMacroGrid
				featured={data.featured}
				selectedCode={currentIndicator.code}
				onSelect={selectIndicator}
			/>
		</section>

		<!-- Section 2: Active Visualization Stage -->
		<section id="visualization-stage" class="space-y-4 pt-2">
			<div class="border border-base-300 rounded bg-base-100 p-5 space-y-4 shadow-sm">
				<!-- Active Indicator Title & Metadata Bar -->
				<div
					class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-base-300 pb-3"
				>
					<div class="space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							{#if currentIndicator.isEssential}
								<span class="badge badge-xs badge-primary font-semibold">Core Essential Stat</span>
							{/if}
							<span class="badge badge-xs badge-outline">{currentIndicator.category}</span>
							<span class="text-xs font-mono text-base-content/50">{currentIndicator.code}</span>
							{#if isLoading}
								<span class="loading loading-spinner loading-xs text-primary"></span>
							{/if}
						</div>
						<h3 class="text-lg sm:text-xl font-bold tracking-tight text-base-content">
							{currentIndicator.shortTitle ? `${currentIndicator.shortTitle} — ` : ''}{currentIndicator.name}
						</h3>
					</div>

					<div
						class="flex items-center gap-2 self-start md:self-auto text-xs text-base-content/60 font-mono"
					>
						<span
							>Coverage: <strong>{currentIndicator.firstYear}–{currentIndicator.lastYear}</strong></span
						>
						<span>({currentIndicator.count} recorded years)</span>
					</div>
				</div>

				<!-- Stats Summary Metrics -->
				<IndicatorStatsCards indicator={currentIndicator} />

				<!-- Tab Navigation -->
				<!-- Tab Navigation & Action Bar -->
				<div class="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 pt-2">
					<div class="flex items-center gap-1 overflow-x-auto">
						<button
							type="button"
							class="px-3 py-2 text-xs font-semibold border-b-2 transition-colors {activeTab ===
							'chart'
								? 'border-primary text-primary'
								: 'border-transparent text-base-content/60 hover:text-base-content'}"
							onclick={() => (activeTab = 'chart')}
						>
							📊 Historical Chart
						</button>
						<button
							type="button"
							class="px-3 py-2 text-xs font-semibold border-b-2 transition-colors {activeTab ===
							'table'
								? 'border-primary text-primary'
								: 'border-transparent text-base-content/60 hover:text-base-content'}"
							onclick={() => (activeTab = 'table')}
						>
							📋 Observation Records ({currentIndicator.history.length})
						</button>
						<button
							type="button"
							class="px-3 py-2 text-xs font-semibold border-b-2 transition-colors {activeTab ===
							'meta'
								? 'border-primary text-primary'
								: 'border-transparent text-base-content/60 hover:text-base-content'}"
							onclick={() => (activeTab = 'meta')}
						>
							ℹ️ Methodology & Notes
						</button>
					</div>

					<div class="flex items-center gap-1.5 pb-1">
						<button
							type="button"
							class="btn btn-xs {isCopied
								? 'btn-success text-white'
								: 'btn-outline border-base-300 text-base-content/70 hover:text-base-content'} font-normal gap-1"
							onclick={copyShareUrl}
							title="Copy direct link to this indicator"
						>
							{#if isCopied}
								<span>✓ Link Copied!</span>
							{:else}
								<span>🔗 Share Link</span>
							{/if}
						</button>
					</div>
				</div>

				<!-- Tab Panels -->
				<div>
					{#if activeTab === 'chart'}
						<StatChart indicator={currentIndicator} />
					{:else if activeTab === 'table'}
						<DataTable indicator={currentIndicator} />
					{:else if activeTab === 'meta'}
						<IndicatorMetadata indicator={currentIndicator} />
					{/if}
				</div>
			</div>
		</section>

		<!-- Section 3: Supplementary Indicator Archive (Others not highlighted) -->
		<section id="indicator-archive" class="space-y-4 pt-4">
			<IndicatorExplorer
				catalog={data.catalog}
				categories={data.categories}
				selectedCode={currentIndicator.code}
				onSelect={selectIndicator}
			/>
		</section>
	</div>
</main>
