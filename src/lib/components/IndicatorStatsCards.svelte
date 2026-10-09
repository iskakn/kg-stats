<script lang="ts">
	import type { IndicatorFull } from '#lib/server/worldbank';
	import { formatValue } from '#lib/utils/format';

	interface Props {
		indicator: IndicatorFull;
	}

	let { indicator }: Props = $props();

	// Find peak and trough years
	let peakPoint = $derived.by(() => {
		if (indicator.history.length === 0) return null;
		return indicator.history.reduce(
			(max, curr) => (curr.value > max.value ? curr : max),
			indicator.history[0]
		);
	});

	let troughPoint = $derived.by(() => {
		if (indicator.history.length === 0) return null;
		return indicator.history.reduce(
			(min, curr) => (curr.value < min.value ? curr : min),
			indicator.history[0]
		);
	});

	let isPositiveTrend = $derived((indicator.yoyChange ?? 0) >= 0);
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
	<!-- Latest Value -->
	<div class="border border-base-300 rounded bg-base-100 p-4">
		<span class="text-[11px] font-semibold uppercase tracking-wider text-base-content/60">
			Latest ({indicator.lastYear})
		</span>
		<div class="text-xl font-bold tracking-tight text-primary mt-1">
			{formatValue(indicator.latestValue, indicator.name)}
		</div>
		<div class="text-xs text-base-content/60 mt-1 flex items-center gap-1">
			{#if indicator.yoyPercent !== undefined}
				<span class="font-medium {isPositiveTrend ? 'text-success' : 'text-error'}">
					{isPositiveTrend ? '▲' : '▼'} {Math.abs(indicator.yoyPercent).toFixed(1)}%
				</span>
				<span>vs {indicator.lastYear - 1}</span>
			{:else}
				<span>Single latest observation</span>
			{/if}
		</div>
	</div>

	<!-- All-Time High -->
	<div class="border border-base-300 rounded bg-base-100 p-4">
		<span class="text-[11px] font-semibold uppercase tracking-wider text-base-content/60">
			All-Time High
		</span>
		<div class="text-xl font-bold tracking-tight text-base-content mt-1">
			{formatValue(indicator.maxValue, indicator.name)}
		</div>
		<div class="text-xs text-base-content/60 mt-1 font-mono">
			Recorded in {peakPoint?.year ?? '—'}
		</div>
	</div>

	<!-- All-Time Low -->
	<div class="border border-base-300 rounded bg-base-100 p-4">
		<span class="text-[11px] font-semibold uppercase tracking-wider text-base-content/60">
			All-Time Low
		</span>
		<div class="text-xl font-bold tracking-tight text-base-content mt-1">
			{formatValue(indicator.minValue, indicator.name)}
		</div>
		<div class="text-xs text-base-content/60 mt-1 font-mono">
			Recorded in {troughPoint?.year ?? '—'}
		</div>
	</div>

	<!-- Data Coverage -->
	<div class="border border-base-300 rounded bg-base-100 p-4">
		<span class="text-[11px] font-semibold uppercase tracking-wider text-base-content/60">
			Time Series Span
		</span>
		<div class="text-xl font-bold tracking-tight text-base-content mt-1 font-mono">
			{indicator.firstYear} – {indicator.lastYear}
		</div>
		<div class="text-xs text-base-content/60 mt-1">
			{indicator.count} recorded years
		</div>
	</div>
</div>
