<script lang="ts">
	import type { IndicatorFull, DataPoint } from '#lib/server/worldbank';
	import { formatValue, formatCompact } from '#lib/utils/format';

	interface Props {
		indicator: IndicatorFull;
	}

	let { indicator }: Props = $props();

	type ChartMode = 'area' | 'line' | 'bar';
	let chartMode = $state<ChartMode>('area');

	// Time range state
	let selectedRange = $state<'all' | '1991' | '2000' | '2010'>('all');

	// Hover scrub state
	let hoveredIndex = $state<number | null>(null);

	// Derived range bounds
	let minYearAvailable = $derived(indicator.history.length > 0 ? indicator.history[0].year : 1960);
	let maxYearAvailable = $derived(
		indicator.history.length > 0 ? indicator.history[indicator.history.length - 1].year : 2025
	);

	let rangeStartYear = $derived.by(() => {
		if (selectedRange === '1991') return Math.max(1991, minYearAvailable);
		if (selectedRange === '2000') return Math.max(2000, minYearAvailable);
		if (selectedRange === '2010') return Math.max(2010, minYearAvailable);
		return minYearAvailable;
	});

	// Filter data points by range
	let filteredData = $derived(
		indicator.history.filter(
			(d: DataPoint) => d.year >= rangeStartYear && d.year <= maxYearAvailable
		)
	);

	// SVG layout
	const width = 800;
	const height = 340;
	const padL = 70;
	const padR = 25;
	const padT = 30;
	const padB = 45;
	const innerW = width - padL - padR;
	const innerH = height - padT - padB;

	// Value domain
	let yDomain = $derived.by(() => {
		if (filteredData.length === 0) return { min: 0, max: 100 };
		const vals = filteredData.map((d: DataPoint) => d.value);
		let min = Math.min(...vals);
		let max = Math.max(...vals);

		if (min === max) {
			min = min * 0.9;
			max = max * 1.1;
		}

		// Add 6% breathing room
		const diff = max - min;
		const pad = diff * 0.06;
		return {
			min: min - pad,
			max: max + pad
		};
	});

	// Scaling functions
	function getX(year: number): number {
		const span = maxYearAvailable - rangeStartYear;
		if (span <= 0) return padL + innerW / 2;
		return padL + ((year - rangeStartYear) / span) * innerW;
	}

	function getY(val: number): number {
		const span = yDomain.max - yDomain.min;
		if (span <= 0) return padT + innerH / 2;
		return padT + innerH - ((val - yDomain.min) / span) * innerH;
	}

	// SVG Path calculations
	let linePath = $derived.by(() => {
		if (filteredData.length === 0) return '';
		return filteredData.reduce((acc: string, pt: DataPoint, idx: number) => {
			const x = getX(pt.year);
			const y = getY(pt.value);
			return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
		}, '');
	});

	let areaPath = $derived.by(() => {
		if (filteredData.length === 0) return '';
		const firstX = getX(filteredData[0].year);
		const lastX = getX(filteredData[filteredData.length - 1].year);
		const baselineY = padT + innerH;
		return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
	});

	// Grid ticks
	let yTicks = $derived.by(() => {
		const ticks = [];
		const count = 5;
		for (let i = 0; i <= count; i++) {
			const val = yDomain.min + (i / count) * (yDomain.max - yDomain.min);
			const y = getY(val);
			ticks.push({ val, y });
		}
		return ticks;
	});

	let xTicks = $derived.by(() => {
		if (filteredData.length <= 1) return [];
		const years = filteredData.map((d: DataPoint) => d.year);
		const step = Math.max(1, Math.ceil(years.length / 8));
		return years.filter((_: number, idx: number) => idx % step === 0 || idx === years.length - 1);
	});

	// Active hovered item
	let hoveredPoint = $derived(
		hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < filteredData.length
			? filteredData[hoveredIndex]
			: null
	);

	function handleMouseMove(e: MouseEvent) {
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const svgX = (mouseX / rect.width) * width;

		if (svgX < padL || svgX > width - padR || filteredData.length === 0) {
			hoveredIndex = null;
			return;
		}

		let closestIdx = 0;
		let closestDist = Infinity;
		filteredData.forEach((pt: DataPoint, idx: number) => {
			const px = getX(pt.year);
			const dist = Math.abs(px - svgX);
			if (dist < closestDist) {
				closestDist = dist;
				closestIdx = idx;
			}
		});

		hoveredIndex = closestIdx;
	}

	function handleMouseLeave() {
		hoveredIndex = null;
	}

	import {
		downloadIndicatorCSV,
		downloadIndicatorJSON,
		downloadChartSVG
	} from '#lib/utils/export';

	let svgRef = $state<SVGSVGElement | null>(null);

	function exportCurrentCSV() {
		downloadIndicatorCSV(indicator, filteredData);
	}

	function exportCurrentJSON() {
		downloadIndicatorJSON(indicator, filteredData);
	}

	function exportCurrentSVG() {
		if (svgRef) {
			downloadChartSVG(
				svgRef,
				`${indicator.code}_Kyrgyzstan_${rangeStartYear}-${maxYearAvailable}.svg`
			);
		}
	}
</script>

<div class="border border-base-300 rounded bg-base-100 p-5 space-y-4">
	<!-- Top Controls -->
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-3">
		<!-- Time range presets -->
		<div class="flex flex-wrap items-center gap-1.5">
			<span class="text-xs text-base-content/60 font-medium mr-1">Period:</span>
			<button
				type="button"
				class="btn btn-xs rounded {selectedRange === 'all'
					? 'btn-primary'
					: 'btn-outline border-base-300 font-normal'}"
				onclick={() => (selectedRange = 'all')}
			>
				All Time ({minYearAvailable}–{maxYearAvailable})
			</button>
			<button
				type="button"
				class="btn btn-xs rounded {selectedRange === '1991'
					? 'btn-primary'
					: 'btn-outline border-base-300 font-normal'}"
				onclick={() => (selectedRange = '1991')}
			>
				Since 1991
			</button>
			<button
				type="button"
				class="btn btn-xs rounded {selectedRange === '2000'
					? 'btn-primary'
					: 'btn-outline border-base-300 font-normal'}"
				onclick={() => (selectedRange = '2000')}
			>
				2000s
			</button>
			<button
				type="button"
				class="btn btn-xs rounded {selectedRange === '2010'
					? 'btn-primary'
					: 'btn-outline border-base-300 font-normal'}"
				onclick={() => (selectedRange = '2010')}
			>
				Last 15 Years
			</button>
		</div>

		<!-- Chart Type and Download -->
		<div class="flex items-center gap-2">
			<!-- Chart Type Controls -->
			<div class="join border border-base-300 rounded">
				<button
					type="button"
					class="join-item btn btn-xs {chartMode === 'area' ? 'btn-primary' : 'btn-ghost'}"
					onclick={() => (chartMode = 'area')}
				>
					Area
				</button>
				<button
					type="button"
					class="join-item btn btn-xs {chartMode === 'line' ? 'btn-primary' : 'btn-ghost'}"
					onclick={() => (chartMode = 'line')}
				>
					Line
				</button>
				<button
					type="button"
					class="join-item btn btn-xs {chartMode === 'bar' ? 'btn-primary' : 'btn-ghost'}"
					onclick={() => (chartMode = 'bar')}
				>
					Bar
				</button>
			</div>

			<!-- Export Dropdown -->
			<div class="dropdown dropdown-end">
				<div
					tabindex="0"
					role="button"
					class="btn btn-xs btn-outline border-base-300 text-xs font-normal gap-1"
				>
					<span>⬇ Export</span>
					<span class="text-[9px]">▼</span>
				</div>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<ul
					tabindex="0"
					class="dropdown-content menu p-1 shadow-lg bg-white rounded-box w-36 border border-base-300 z-20 text-xs"
				>
					<li>
						<button type="button" onclick={exportCurrentCSV} class="py-1">
							📄 CSV Data
						</button>
					</li>
					<li>
						<button type="button" onclick={exportCurrentJSON} class="py-1">
							🧾 JSON Data
						</button>
					</li>
					<li>
						<button type="button" onclick={exportCurrentSVG} class="py-1">
							📊 Chart (SVG)
						</button>
					</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- SVG Interactive Visualizer -->
	<div class="relative w-full overflow-hidden select-none">
		<svg
			bind:this={svgRef}
			viewBox="0 0 {width} {height}"
			class="w-full h-auto overflow-visible cursor-crosshair"
			onmousemove={handleMouseMove}
			onmouseleave={handleMouseLeave}
			role="img"
			aria-label="Time series chart for {indicator.name}"
		>
			<defs>
				<linearGradient id="areaGradientLight" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.22" />
					<stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.01" />
				</linearGradient>
			</defs>

			<!-- Horizontal Grid lines & Y ticks -->
			{#each yTicks as tick (tick.y)}
				<line
					x1={padL}
					y1={tick.y}
					x2={width - padR}
					y2={tick.y}
					stroke="currentColor"
					class="text-base-300"
					stroke-width="1"
					stroke-dasharray="3 3"
				/>
				<text
					x={padL - 8}
					y={tick.y + 4}
					text-anchor="end"
					class="text-[11px] fill-base-content/60 font-mono"
				>
					{formatCompact(tick.val)}
				</text>
			{/each}

			<!-- Vertical reference gridlines & X axis labels -->
			{#each xTicks as year (year)}
				{@const x = getX(year)}
				<line
					x1={x}
					y1={padT}
					x2={x}
					y2={padT + innerH}
					stroke="currentColor"
					class="text-base-300/60"
					stroke-width="1"
				/>
				<text
					x={x}
					y={height - padB + 18}
					text-anchor="middle"
					class="text-[11px] fill-base-content/70 font-mono"
				>
					{year}
				</text>
			{/each}

			<!-- Zero reference line if within domain -->
			{#if yDomain.min <= 0 && yDomain.max >= 0}
				{@const zeroY = getY(0)}
				<line
					x1={padL}
					y1={zeroY}
					x2={width - padR}
					y2={zeroY}
					stroke="currentColor"
					class="text-base-content/40"
					stroke-width="1.5"
				/>
			{/if}

			<!-- Primary Series Rendering -->
			{#if chartMode === 'area' && areaPath}
				<path d={areaPath} fill="url(#areaGradientLight)" />
				<path
					d={linePath}
					fill="none"
					stroke="var(--color-primary)"
					stroke-width="2.5"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
			{:else if chartMode === 'line' && linePath}
				<path
					d={linePath}
					fill="none"
					stroke="var(--color-primary)"
					stroke-width="2.5"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
			{:else if chartMode === 'bar'}
				{@const barW = Math.max(3, Math.min(18, (innerW / filteredData.length) * 0.7))}
				{#each filteredData as pt (pt.year)}
					{@const bx = getX(pt.year) - barW / 2}
					{@const by = getY(Math.max(0, pt.value))}
					{@const bBaseline = getY(Math.min(0, pt.value))}
					{@const bHeight = Math.max(2, Math.abs(getY(pt.value) - getY(Math.min(0, pt.value))))}
					<rect
						x={bx}
						y={Math.min(by, bBaseline)}
						width={barW}
						height={bHeight}
						class="fill-primary hover:opacity-80 transition-opacity"
						rx="1"
					/>
				{/each}
			{/if}

			<!-- Data Points Dots -->
			{#if chartMode !== 'bar'}
				{#each filteredData as pt (pt.year)}
					{@const cx = getX(pt.year)}
					{@const cy = getY(pt.value)}
					<circle
						{cx}
						{cy}
						r="3"
						class="fill-white stroke-primary transition-all duration-150"
						stroke-width="2"
					/>
				{/each}
			{/if}

			<!-- Interactive Hover Cursor -->
			{#if hoveredPoint}
				{@const hx = getX(hoveredPoint.year)}
				{@const hy = getY(hoveredPoint.value)}

				<!-- Vertical crosshair guide -->
				<line
					x1={hx}
					y1={padT}
					x2={hx}
					y2={padT + innerH}
					stroke="currentColor"
					class="text-base-content/50"
					stroke-width="1.5"
					stroke-dasharray="3 3"
				/>

				<!-- Hovered point highlight -->
				<circle cx={hx} cy={hy} r="5.5" class="fill-primary stroke-white" stroke-width="2.5" />
			{/if}
		</svg>

		<!-- Tooltip floating card -->
		{#if hoveredPoint}
			<div
				class="absolute top-3 right-5 bg-white border border-base-300 rounded shadow-sm p-3 text-xs space-y-1 pointer-events-none z-10"
			>
				<div class="flex items-center justify-between gap-4">
					<span class="font-bold text-sm text-base-content font-mono">{hoveredPoint.year}</span>
					<span class="text-[10px] font-mono text-base-content/60 uppercase tracking-wider"
						>World Bank Data</span
					>
				</div>
				<div class="text-base font-bold text-primary font-mono">
					{formatValue(hoveredPoint.value, indicator.name)}
				</div>
			</div>
		{/if}
	</div>

	<!-- Bottom Legend & Summary -->
	<div
		class="flex flex-wrap items-center justify-between gap-3 text-xs text-base-content/70 pt-2 border-t border-base-200"
	>
		<div class="flex items-center gap-2">
			<span class="w-3 h-3 rounded-full bg-primary inline-block"></span>
			<span class="font-medium text-base-content">{indicator.shortTitle || indicator.name}</span>
		</div>

		<div class="flex items-center gap-4 font-mono text-xs">
			<span>Observations: <strong class="text-base-content">{filteredData.length}</strong></span>
			<span
				>Min: <strong class="text-base-content"
					>{formatValue(indicator.minValue, indicator.name)}</strong
				></span
			>
			<span
				>Max: <strong class="text-base-content"
					>{formatValue(indicator.maxValue, indicator.name)}</strong
				></span
			>
		</div>
	</div>
</div>
