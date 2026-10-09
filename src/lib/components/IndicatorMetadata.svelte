<script lang="ts">
	import type { IndicatorFull } from '#lib/server/worldbank';

	interface Props {
		indicator: IndicatorFull;
	}

	let { indicator }: Props = $props();

	let copied = $state(false);

	function copyCode() {
		navigator.clipboard.writeText(indicator.code);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<div class="border border-base-300 rounded bg-base-100 p-5 space-y-3">
	<div class="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 pb-3">
		<h4 class="font-bold text-xs uppercase tracking-wider text-base-content/70">
			World Bank Metadata & Methodology
		</h4>
		<div class="flex items-center gap-2">
			<span class="text-xs font-mono bg-base-200 px-2 py-0.5 rounded border border-base-300">
				{indicator.code}
			</span>
			<button type="button" class="btn btn-xs btn-outline border-base-300" onclick={copyCode}>
				{copied ? '✓ Copied' : 'Copy Code'}
			</button>
		</div>
	</div>

	<div class="space-y-2 text-xs">
		{#if indicator.sourceNote}
			<div>
				<span class="font-semibold text-base-content/80 block mb-0.5"
					>Statistical Definition:</span
				>
				<p class="text-base-content/70 leading-relaxed">{indicator.sourceNote}</p>
			</div>
		{/if}

		{#if indicator.sourceOrg}
			<div class="border-t border-base-200 pt-2">
				<span class="font-semibold text-base-content/80 block mb-0.5"
					>Source Organization:</span
				>
				<p class="text-base-content/70">{indicator.sourceOrg}</p>
			</div>
		{/if}

		<div
			class="border-t border-base-200 pt-2 flex flex-wrap items-center justify-between gap-2 text-base-content/60"
		>
			<span>Primary Category: <strong>{indicator.category}</strong></span>
			<span>Dataset: <strong>World Development Indicators (WDI)</strong></span>
		</div>
	</div>
</div>
