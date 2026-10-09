<script lang="ts">
	import type { IndicatorFull } from '#lib/server/worldbank';
	import { formatValue } from '#lib/utils/format';
	import { downloadIndicatorCSV } from '#lib/utils/export';

	interface Props {
		indicator: IndicatorFull;
		compareIndicator?: IndicatorFull | null;
	}

	let { indicator, compareIndicator = null }: Props = $props();

	let sortDesc = $state(true);
	let filterYear = $state('');

	let tableRows = $derived.by(() => {
		let rows = indicator.history.map((pt, idx) => {
			const prev = idx > 0 ? indicator.history[idx - 1].value : undefined;
			const yoy = prev !== undefined ? pt.value - prev : undefined;
			const yoyPct =
				prev !== undefined && prev !== 0 ? (yoy! / Math.abs(prev)) * 100 : undefined;

			let compareVal: number | undefined;
			if (compareIndicator) {
				const match = compareIndicator.history.find((c) => c.year === pt.year);
				compareVal = match?.value;
			}

			return {
				year: pt.year,
				value: pt.value,
				yoy,
				yoyPct,
				compareVal
			};
		});

		if (filterYear.trim()) {
			rows = rows.filter((r) => r.year.toString().includes(filterYear.trim()));
		}

		return sortDesc ? [...rows].reverse() : rows;
	});
</script>

<div class="border border-base-300 rounded bg-base-100 overflow-hidden">
	<div
		class="px-5 py-3 border-b border-base-300 flex flex-wrap items-center justify-between gap-3"
	>
		<div>
			<h4 class="font-bold text-xs uppercase tracking-wider text-base-content/70">
				Historical Observations ({indicator.history.length} years)
			</h4>
		</div>

		<div class="flex items-center gap-2">
			<input
				type="text"
				placeholder="Filter year..."
				class="input input-xs input-bordered border-base-300 w-24 text-xs font-mono"
				bind:value={filterYear}
			/>

			<button
				type="button"
				class="btn btn-xs btn-outline border-base-300"
				onclick={() => (sortDesc = !sortDesc)}
			>
				Year {sortDesc ? '▼ (Latest)' : '▲ (Oldest)'}
			</button>

			<button
				type="button"
				class="btn btn-xs btn-outline border-base-300 font-normal"
				onclick={() => downloadIndicatorCSV(indicator)}
				title="Export all observations as CSV"
			>
				⬇ Export CSV
			</button>
		</div>
	</div>

	<div class="overflow-x-auto max-h-72">
		<table class="table table-xs table-pin-rows">
			<thead>
				<tr class="text-base-content/70 border-b border-base-300 bg-base-200/50">
					<th class="py-2">Year</th>
					<th class="py-2 text-right">{indicator.name}</th>
					<th class="py-2 text-right">YoY Change</th>
					<th class="py-2 text-right">YoY %</th>
					{#if compareIndicator}
						<th class="py-2 text-right text-secondary">{compareIndicator.name}</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each tableRows as row (row.year)}
					<tr class="hover:bg-base-200/40 border-b border-base-200 font-mono text-xs">
						<td class="font-bold font-mono">{row.year}</td>
						<td class="text-right text-primary font-semibold"
							>{formatValue(row.value, indicator.name)}</td
						>
						<td
							class="text-right {row.yoy === undefined
								? 'text-base-content/40'
								: row.yoy >= 0
									? 'text-success'
									: 'text-error'}"
						>
							{#if row.yoy !== undefined}
								{row.yoy >= 0 ? '+' : ''}{row.yoy.toLocaleString('en-US', {
									maximumFractionDigits: 2
								})}
							{:else}
								—
							{/if}
						</td>
						<td
							class="text-right {row.yoyPct === undefined
								? 'text-base-content/40'
								: row.yoyPct >= 0
									? 'text-success'
									: 'text-error'}"
						>
							{#if row.yoyPct !== undefined}
								{row.yoyPct >= 0 ? '+' : ''}{row.yoyPct.toFixed(1)}%
							{:else}
								—
							{/if}
						</td>
						{#if compareIndicator}
							<td class="text-right text-secondary">
								{formatValue(row.compareVal, compareIndicator.name)}
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
