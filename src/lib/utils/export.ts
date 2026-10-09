import type { IndicatorFull, DataPoint } from '#lib/server/worldbank';

export function downloadIndicatorCSV(indicator: IndicatorFull, dataPoints?: DataPoint[]) {
	const points = dataPoints ?? indicator.history;
	const header = ['Year', 'Indicator Name', 'Indicator Code', 'Value'];
	const rows = points.map((p) => [
		p.year.toString(),
		`"${indicator.name.replace(/"/g, '""')}"`,
		indicator.code,
		p.value.toString()
	]);

	const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	triggerBlobDownload(
		blob,
		`${indicator.code}_${indicator.firstYear}-${indicator.lastYear}.csv`
	);
}

export function downloadIndicatorJSON(indicator: IndicatorFull, dataPoints?: DataPoint[]) {
	const points = dataPoints ?? indicator.history;
	const payload = {
		code: indicator.code,
		name: indicator.name,
		shortTitle: indicator.shortTitle,
		category: indicator.category,
		source: 'World Bank World Development Indicators (WDI)',
		sourceUrl: 'https://data.worldbank.org/country/kyrgyz-republic',
		downloadDate: new Date().toISOString(),
		totalObservations: points.length,
		observations: points.map((p) => ({ year: p.year, value: p.value }))
	};

	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: 'application/json;charset=utf-8;'
	});
	triggerBlobDownload(
		blob,
		`${indicator.code}_${indicator.firstYear}-${indicator.lastYear}.json`
	);
}

export function downloadChartSVG(svgElement: SVGElement, filename: string) {
	const serializer = new XMLSerializer();
	let source = serializer.serializeToString(svgElement);

	// Add XML declaration and namespaces if missing
	if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
		source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
	}
	if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
		source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
	}

	const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
	triggerBlobDownload(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}

function triggerBlobDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
