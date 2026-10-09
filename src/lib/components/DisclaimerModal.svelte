<script lang="ts">
	import { onMount } from 'svelte';

	let isOpen = $state(false);

	onMount(() => {
		try {
			const accepted = localStorage.getItem('kg_stats_ai_disclaimer_accepted');
			if (!accepted) {
				isOpen = true;
			}
		} catch {
			isOpen = true;
		}
	});

	function handleDismiss() {
		try {
			localStorage.setItem('kg_stats_ai_disclaimer_accepted', 'true');
		} catch {
			// ignore
		}
		isOpen = false;
	}

	export function openModal() {
		isOpen = true;
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-labelledby="disclaimer-title"
	>
		<div
			class="bg-white border border-base-300 rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4 text-base-content antialiased"
		>
			<div class="flex items-start gap-3">
				<div
					class="w-10 h-10 rounded bg-warning/15 text-warning flex items-center justify-center shrink-0 text-xl font-bold"
				>
					⚠️
				</div>
				<div>
					<h2 id="disclaimer-title" class="text-base font-bold text-base-content tracking-tight">
						AI-Generated Project & Data Disclaimer
					</h2>
					<p class="text-xs text-base-content/60 mt-0.5">
						Notice regarding software generation and statistical data source
					</p>
				</div>
			</div>

			<div
				class="text-xs text-base-content/80 space-y-3 leading-relaxed border-t border-b border-base-200 py-3"
			>
				<div class="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-medium">
					<strong>Zero Guarantee Notice:</strong> This entire project (codebase, UI components,
					parsers, visualizations, and architecture) was <strong>created by AI</strong>. There is
					<strong>zero guarantee</strong> that it works, is free of defects, or is fit for any official,
					legal, or analytical purpose.
				</div>

				<div class="space-y-1.5">
					<p>
						<strong>Raw & Untouched Data:</strong> While the software code is AI-generated, the underlying
						statistical dataset itself is <strong>100% untouched and unmanipulated</strong>. It was grabbed
						directly from the official World Bank repository:
					</p>
					<ul class="list-disc list-inside space-y-1 pl-1 text-primary">
						<li>
							<a
								href="https://data.worldbank.org/country/kyrgyz-republic"
								target="_blank"
								rel="noopener noreferrer"
								class="underline hover:text-primary/80 font-mono text-[11px]"
							>
								https://data.worldbank.org/country/kyrgyz-republic
							</a>
						</li>
						<li>
							<a
								href="https://api.worldbank.org/v2/en/country/KGZ?downloadformat=csv"
								target="_blank"
								rel="noopener noreferrer"
								class="underline hover:text-primary/80 font-mono text-[11px]"
							>
								https://api.worldbank.org/v2/en/country/KGZ?downloadformat=csv
							</a>
						</li>
					</ul>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 pt-1">
				<button
					type="button"
					class="btn btn-sm btn-primary w-full sm:w-auto px-6 font-semibold"
					onclick={handleDismiss}
				>
					I Understand & Proceed
				</button>
			</div>
		</div>
	</div>
{/if}
