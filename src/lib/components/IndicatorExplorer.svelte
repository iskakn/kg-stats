<script lang="ts">
	import type { IndicatorMeta, CategorySummary } from '#lib/server/worldbank';
	import { formatValue } from '#lib/utils/format';

	interface Props {
		catalog: IndicatorMeta[];
		categories: CategorySummary[];
		selectedCode: string;
		onSelect: (code: string) => void;
	}

	let { catalog, categories, selectedCode, onSelect }: Props = $props();

	let searchQuery = $state('');
	let selectedCategory = $state('All');
	let filterOnlyEssential = $state(false);
	let sortBy = $state<'name' | 'count' | 'recent'>('name');
	let page = $state(1);
	const pageSize = 15;

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
		page = 1;
	}

	function handleCategorySelect(catName: string) {
		selectedCategory = catName;
		page = 1;
	}

	let filteredList = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		let result = catalog;

		if (filterOnlyEssential) {
			result = result.filter((item) => item.isEssential);
		}

		if (selectedCategory !== 'All') {
			result = result.filter((item) => item.category === selectedCategory);
		}

		if (q) {
			result = result.filter(
				(item) =>
					item.name.toLowerCase().includes(q) ||
					item.code.toLowerCase().includes(q) ||
					(item.shortTitle && item.shortTitle.toLowerCase().includes(q)) ||
					(item.sourceNote && item.sourceNote.toLowerCase().includes(q))
			);
		}

		if (sortBy === 'count') {
			result = [...result].sort((a, b) => b.count - a.count);
		} else if (sortBy === 'recent') {
			result = [...result].sort((a, b) => b.lastYear - a.lastYear || b.count - a.count);
		} else {
			result = [...result].sort((a, b) => {
				if (a.isEssential && !b.isEssential) return -1;
				if (!a.isEssential && b.isEssential) return 1;
				return a.name.localeCompare(b.name);
			});
		}

		return result;
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filteredList.length / pageSize)));
	let paginatedList = $derived(filteredList.slice((page - 1) * pageSize, page * pageSize));
</script>

<div class="border border-base-300 rounded bg-base-100 p-5 space-y-4">
	<div
		class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-300 pb-3"
	>
		<div>
			<h3 class="font-bold text-sm tracking-tight text-base-content">
				Supplementary Indicator Archive
			</h3>
			<p class="text-xs text-base-content/60">
				Search all {catalog.length.toLocaleString()} official indicators in the World Bank database
				for Kyrgyzstan
			</p>
		</div>

		<!-- Quick filter & Sort -->
		<div class="flex flex-wrap items-center gap-2 text-xs">
			<label
				class="flex items-center gap-1.5 cursor-pointer text-base-content/70 hover:text-base-content"
			>
				<input
					type="checkbox"
					class="checkbox checkbox-xs rounded border-base-300"
					bind:checked={filterOnlyEssential}
					onchange={() => (page = 1)}
				/>
				<span>Essential Only</span>
			</label>

			<span class="text-base-300">|</span>

			<span class="text-base-content/60">Sort:</span>
			<select
				class="select select-xs select-bordered border-base-300 font-normal"
				value={sortBy}
				onchange={(e) =>
					(sortBy = (e.target as HTMLSelectElement).value as 'name' | 'count' | 'recent')}
			>
				<option value="name">Name (A-Z)</option>
				<option value="count">Most Historical Years</option>
				<option value="recent">Most Recent Year</option>
			</select>
		</div>
	</div>

	<!-- Search Input -->
	<div class="relative">
		<input
			type="text"
			placeholder="Search across all 1,400+ indicators (e.g., export, education, debt, water, forest, hospital)..."
			class="input input-sm input-bordered w-full border-base-300 pr-10 text-xs"
			value={searchQuery}
			oninput={handleSearchInput}
		/>
		{#if searchQuery}
			<button
				type="button"
				class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
				onclick={() => {
					searchQuery = '';
					page = 1;
				}}
			>
				✕
			</button>
		{/if}
	</div>

	<!-- Category Filter Pills -->
	<div class="flex flex-wrap gap-1.5 overflow-x-auto pb-1 text-xs">
		<button
			type="button"
			class="btn btn-xs {selectedCategory === 'All' ? 'btn-neutral' : 'btn-ghost'}"
			onclick={() => handleCategorySelect('All')}
		>
			All ({catalog.length})
		</button>
		{#each categories as cat (cat.name)}
			<button
				type="button"
				class="btn btn-xs {selectedCategory === cat.name ? 'btn-neutral' : 'btn-ghost'}"
				onclick={() => handleCategorySelect(cat.name)}
			>
				{cat.icon}
				{cat.name} ({cat.count})
			</button>
		{/each}
	</div>

	<!-- Results summary -->
	<div class="flex items-center justify-between text-xs text-base-content/60 px-1">
		<span>
			Showing <strong>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredList.length)}</strong> of
			<strong>{filteredList.length}</strong> indicators
		</span>
		<span>Page {page} of {totalPages}</span>
	</div>

	<!-- Quiet unhighlighted list -->
	<div class="divide-y divide-base-200 border border-base-300 rounded overflow-hidden">
		{#if paginatedList.length === 0}
			<div class="p-8 text-center text-xs text-base-content/60">
				No matching indicators found for "<strong>{searchQuery}</strong>".
			</div>
		{:else}
			{#each paginatedList as ind (ind.code)}
				{@const isSelected = ind.code === selectedCode}
				<div
					class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-base-200/40 transition-colors {isSelected
						? 'bg-primary/5 border-l-4 border-l-primary'
						: ''}"
				>
					<div class="space-y-0.5 flex-1 min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-medium text-xs text-base-content leading-snug">
								{ind.name}
							</span>
							{#if ind.isEssential}
								<span class="badge badge-xs badge-primary font-medium">Core Stat</span>
							{/if}
							<span class="text-[10px] font-mono text-base-content/50">{ind.code}</span>
						</div>

						<div
							class="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-base-content/60"
						>
							<span>Category: {ind.category}</span>
							<span
								>Span: <strong class="font-mono">{ind.firstYear}–{ind.lastYear}</strong> ({ind.count}
								yrs)</span
							>
							<span
								>Latest: <strong class="font-mono text-base-content"
									>{formatValue(ind.latestValue, ind.name)}</strong
								></span
							>
						</div>
					</div>

					<button
						type="button"
						class="btn btn-xs {isSelected
							? 'btn-primary'
							: 'btn-outline border-base-300'} self-end sm:self-center shrink-0"
						onclick={() => onSelect(ind.code)}
					>
						{isSelected ? 'Selected' : 'View Chart'}
					</button>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="flex items-center justify-between pt-1">
			<button
				type="button"
				class="btn btn-xs btn-outline border-base-300"
				disabled={page <= 1}
				onclick={() => (page = Math.max(1, page - 1))}
			>
				← Previous
			</button>

			<div class="flex items-center gap-1 text-xs">
				<span class="text-base-content/60">Page</span>
				<span class="font-bold">{page}</span>
				<span class="text-base-content/60">of {totalPages}</span>
			</div>

			<button
				type="button"
				class="btn btn-xs btn-outline border-base-300"
				disabled={page >= totalPages}
				onclick={() => (page = Math.min(totalPages, page + 1))}
			>
				Next →
			</button>
		</div>
	{/if}
</div>
