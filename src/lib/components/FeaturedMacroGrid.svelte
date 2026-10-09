<script lang="ts">
	import type { IndicatorFull } from '#lib/server/worldbank';
	import { formatValue } from '#lib/utils/format';

	interface Props {
		featured: IndicatorFull[];
		selectedCode: string;
		onSelect: (code: string) => void;
	}

	let { featured, selectedCode, onSelect }: Props = $props();

	function getSparkline(
		history: { year: number; value: number }[],
		w = 80,
		h = 28
	): { line: string; area: string } {
		if (history.length < 2) return { line: '', area: '' };
		const vals = history.map((d) => d.value);
		const min = Math.min(...vals);
		const max = Math.max(...vals);
		const diff = max - min || 1;

		const pts = history.map((pt, idx) => {
			const x = (idx / (history.length - 1)) * w;
			const y = h - ((pt.value - min) / diff) * (h - 6) - 3;
			return { x, y };
		});

		const line = pts.reduce((acc, p, idx) => {
			return idx === 0
				? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
				: `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
		}, '');

		const area = `${line} L ${w} ${h} L 0 ${h} Z`;
		return { line, area };
	}
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
	{#each featured as ind (ind.code)}
		{@const isSelected = ind.code === selectedCode}
		{@const isPositive = (ind.yoyChange ?? 0) >= 0}
		{@const spark = getSparkline(ind.history)}
		<button
			type="button"
			class="relative rounded border text-left p-4 transition-all flex flex-col justify-between gap-3 {isSelected
				? 'bg-base-100 border-primary ring-2 ring-primary/20 shadow-sm'
				: 'bg-base-100 border-base-300 hover:border-base-content/30 hover:bg-base-200/40'}"
			onclick={() => onSelect(ind.code)}
		>
			<div class="flex items-start justify-between gap-2">
				<div>
					<span class="text-xs font-bold text-base-content tracking-tight block">
						{ind.shortTitle || ind.name}
					</span>
					<span class="text-[10px] font-mono text-base-content/50 block mt-0.5">
						{ind.code}
					</span>
				</div>

				{#if ind.yoyPercent !== undefined}
					<span
						class="text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded {isPositive
							? 'bg-success/10 text-success'
							: 'bg-error/10 text-error'} shrink-0"
					>
						{isPositive ? '▲' : '▼'}
						{Math.abs(ind.yoyPercent).toFixed(1)}%
					</span>
				{/if}
			</div>

			<div class="flex items-end justify-between gap-2 pt-1 border-t border-base-200/70">
				<div>
					<div class="text-xl font-bold tracking-tight text-base-content">
						{formatValue(ind.latestValue, ind.name)}
					</div>
					<div class="text-[10px] text-base-content/60 font-mono mt-0.5">
						World Bank {ind.lastYear}
					</div>
				</div>

				<!-- Mini Sparkline SVG -->
				{#if spark.line}
					<svg width="80" height="28" class="shrink-0 overflow-hidden" aria-hidden="true">
						<defs>
							<linearGradient id="sparkGrad-{ind.code}" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.25" />
								<stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0" />
							</linearGradient>
						</defs>
						<path d={spark.area} fill="url(#sparkGrad-{ind.code})" />
						<path
							d={spark.line}
							fill="none"
							stroke="var(--color-primary)"
							stroke-width="1.8"
							stroke-linejoin="round"
						/>
					</svg>
				{/if}
			</div>
		</button>
	{/each}
</div>
