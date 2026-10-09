export function formatValue(val: number | undefined | null, name: string = ''): string {
	if (val === undefined || val === null || isNaN(val)) return '—';

	const lower = name.toLowerCase();

	// Percentage
	if (
		lower.includes('%') ||
		lower.includes('percent') ||
		lower.includes('rate') ||
		lower.includes('share') ||
		lower.includes('ratio')
	) {
		return `${val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
	}

	// Currency (US$)
	if (lower.includes('us$') || lower.includes('usd') || lower.includes('dollar')) {
		if (Math.abs(val) >= 1e9) {
			return `$${(val / 1e9).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
		}
		if (Math.abs(val) >= 1e6) {
			return `$${(val / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
		}
		return `$${val.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
	}

	// Large numbers (Population, volume)
	if (Math.abs(val) >= 1e9) {
		return `${(val / 1e9).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Billion`;
	}
	if (Math.abs(val) >= 1e6) {
		return `${(val / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Million`;
	}

	if (Math.abs(val) >= 1000) {
		return val.toLocaleString('en-US', { maximumFractionDigits: 1 });
	}

	if (Number.isInteger(val)) {
		return val.toLocaleString('en-US');
	}

	return val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 3 });
}

export function formatCompact(val: number): string {
	if (isNaN(val)) return '—';
	const abs = Math.abs(val);
	if (abs >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
	if (abs >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
	if (abs >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
	if (abs < 0.01 && abs > 0) return val.toExponential(1);
	return val.toLocaleString('en-US', { maximumFractionDigits: 1 });
}
