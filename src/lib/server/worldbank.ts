// @ts-ignore
import fs from 'node:fs';
// @ts-ignore
import path from 'node:path';
// @ts-ignore
import zlib from 'node:zlib';

export interface DataPoint {
	year: number;
	value: number;
}

export interface IndicatorMeta {
	code: string;
	name: string;
	shortTitle?: string;
	isEssential?: boolean;
	category: string;
	count: number;
	firstYear: number;
	lastYear: number;
	latestValue: number;
	previousValue?: number;
	yoyChange?: number;
	yoyPercent?: number;
	minValue: number;
	maxValue: number;
	avgValue: number;
	sourceNote?: string;
	sourceOrg?: string;
}

export const ESSENTIAL_INDICATORS: Record<string, string> = {
	'NY.GDP.MKTP.CD': 'Nominal GDP',
	'NY.GDP.MKTP.KD.ZG': 'Real GDP Growth',
	'SP.POP.TOTL': 'Total Population',
	'FP.CPI.TOTL.ZG': 'Inflation Rate',
	'SP.DYN.LE00.IN': 'Life Expectancy',
	'BX.TRF.PWKR.DT.GD.ZS': 'Remittances Share',
	'SI.POV.NAHC': 'National Poverty Rate',
	'SL.UEM.TOTL.ZS': 'Unemployment Rate'
};

export interface IndicatorFull extends IndicatorMeta {
	history: DataPoint[];
}

export interface CategorySummary {
	name: string;
	count: number;
	icon: string;
}

export interface InMemoWorldBankData {
	countryName: string;
	countryCode: string;
	zipFilename: string;
	indicators: Map<string, IndicatorFull>;
	catalog: IndicatorMeta[];
	categories: CategorySummary[];
	featured: IndicatorFull[];
}

let cachedData: InMemoWorldBankData | null = null;
let cachedMtime: number = 0;
let cachedZipName: string = '';

// Parse standard RFC 4180 CSV text in memory
function parseCSV(text: string): string[][] {
	const lines: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (char === '"') {
			if (inQuotes && text[i + 1] === '"') {
				cell += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			row.push(cell);
			cell = '';
		} else if ((char === '\r' || char === '\n') && !inQuotes) {
			if (char === '\r' && text[i + 1] === '\n') {
				i++;
			}
			row.push(cell);
			cell = '';
			if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
				lines.push(row);
			}
			row = [];
		} else {
			cell += char;
		}
	}

	if (cell !== '' || row.length > 0) {
		row.push(cell);
		lines.push(row);
	}

	return lines;
}

// Map indicator code and title to intuitive categories
function determineCategory(code: string, name: string): string {
	const c = code.toUpperCase();
	const n = name.toLowerCase();

	if (
		c.startsWith('NY') ||
		c.startsWith('NE') ||
		c.startsWith('NV') ||
		c.startsWith('BN') ||
		c.startsWith('BX') ||
		c.startsWith('BM') ||
		c.startsWith('FM') ||
		c.startsWith('GC') ||
		c.startsWith('FP') ||
		c.startsWith('PA') ||
		n.includes('gdp') ||
		n.includes('inflation') ||
		n.includes('exports') ||
		n.includes('imports') ||
		n.includes('trade')
	) {
		return 'Economy & Trade';
	}

	if (
		c.startsWith('SP.POP') ||
		c.startsWith('SP.DYN') ||
		c.startsWith('SM.POP') ||
		n.includes('population') ||
		n.includes('fertility') ||
		n.includes('mortality') ||
		n.includes('birth rate') ||
		n.includes('death rate')
	) {
		return 'Demographics';
	}

	if (
		c.startsWith('SH') ||
		n.includes('health') ||
		n.includes('hospital') ||
		n.includes('disease') ||
		n.includes('life expectancy') ||
		n.includes('sanitation') ||
		n.includes('water') ||
		n.includes('immunization')
	) {
		return 'Health & Nutrition';
	}

	if (
		c.startsWith('SE') ||
		n.includes('education') ||
		n.includes('school') ||
		n.includes('literacy') ||
		n.includes('enrollment') ||
		n.includes('science')
	) {
		return 'Education & Science';
	}

	if (
		c.startsWith('SL') ||
		n.includes('unemployment') ||
		n.includes('labor') ||
		n.includes('employment') ||
		n.includes('wages')
	) {
		return 'Labor & Employment';
	}

	if (
		c.startsWith('EG') ||
		c.startsWith('EN') ||
		c.startsWith('ER') ||
		c.startsWith('AG') ||
		n.includes('energy') ||
		n.includes('electricity') ||
		n.includes('forest') ||
		n.includes('emissions') ||
		n.includes('co2') ||
		n.includes('agriculture')
	) {
		return 'Environment & Energy';
	}

	if (
		c.startsWith('IT') ||
		c.startsWith('IS') ||
		c.startsWith('IE') ||
		n.includes('internet') ||
		n.includes('cellular') ||
		n.includes('mobile') ||
		n.includes('transport') ||
		n.includes('railway') ||
		n.includes('air')
	) {
		return 'Infrastructure & Tech';
	}

	if (
		c.startsWith('SI') ||
		n.includes('poverty') ||
		n.includes('gini') ||
		n.includes('income share')
	) {
		return 'Poverty & Social';
	}

	if (
		c.startsWith('FS') ||
		c.startsWith('FB') ||
		c.startsWith('FD') ||
		n.includes('bank') ||
		n.includes('financial') ||
		n.includes('credit') ||
		n.includes('atm')
	) {
		return 'Finance & Banking';
	}

	return 'Governance & Public Sector';
}

function getCategoryIcon(name: string): string {
	switch (name) {
		case 'Economy & Trade':
			return '📈';
		case 'Demographics':
			return '👥';
		case 'Health & Nutrition':
			return '🏥';
		case 'Education & Science':
			return '🎓';
		case 'Labor & Employment':
			return '💼';
		case 'Environment & Energy':
			return '🌱';
		case 'Infrastructure & Tech':
			return '⚡';
		case 'Poverty & Social':
			return '🤝';
		case 'Finance & Banking':
			return '🏦';
		default:
			return '🏛️';
	}
}

// Dynamically locate any World Bank dataset zip file in src/lib/
function findZipFile(): { fullPath: string; filename: string; mtimeMs: number } {
	const libDir = path.resolve(process.cwd(), 'src/lib');
	if (!fs.existsSync(libDir)) {
		throw new Error(`Directory ${libDir} not found`);
	}

	const files: string[] = fs.readdirSync(libDir);
	const zipFiles = files
		.filter((f: string) => f.toLowerCase().endsWith('.zip'))
		.map((f: string) => {
			const fullPath = path.join(libDir, f);
			const stat = fs.statSync(fullPath);
			return { fullPath, filename: f, mtimeMs: stat.mtimeMs };
		});

	if (zipFiles.length === 0) {
		throw new Error(
			'No .zip dataset file found in src/lib/. Please place any World Bank dataset .zip file into src/lib/'
		);
	}

	// Prefer the most recently modified zip file
	zipFiles.sort(
		(a: { mtimeMs: number }, b: { mtimeMs: number }) => b.mtimeMs - a.mtimeMs
	);
	return zipFiles[0];
}

// Unzip archive strictly in memory
function loadAndUnzipInMemory(zipPath: string): Record<string, Buffer> {
	const buf = fs.readFileSync(zipPath);
	const files: Record<string, Buffer> = {};
	let offset = 0;

	while (offset < buf.length) {
		const sig = buf.readUInt32LE(offset);
		if (sig === 0x04034b50) {
			// Local file header in PKZIP format
			const method = buf.readUInt16LE(offset + 8);
			const compSize = buf.readUInt32LE(offset + 18);
			const nameLen = buf.readUInt16LE(offset + 26);
			const extraLen = buf.readUInt16LE(offset + 28);
			const filename = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
			const dataStart = offset + 30 + nameLen + extraLen;
			const compData = buf.subarray(dataStart, dataStart + compSize);

			if (method === 0) {
				files[filename] = compData;
			} else if (method === 8) {
				// Deflate compression
				files[filename] = zlib.inflateRawSync(compData);
			}

			offset = dataStart + compSize;
		} else {
			break;
		}
	}

	return files;
}

export function getWorldBankData(): InMemoWorldBankData {
	const zipInfo = findZipFile();

	// Invalidate cache if zip file changed or modified
	if (
		cachedData &&
		cachedMtime === zipInfo.mtimeMs &&
		cachedZipName === zipInfo.filename
	) {
		return cachedData;
	}

	const startTime = Date.now();
	const unzippedFiles = loadAndUnzipInMemory(zipInfo.fullPath);
	const fileKeys = Object.keys(unzippedFiles);

	// Find the indicator metadata CSV dynamically
	const metaKey = fileKeys.find(
		(k) => k.includes('Metadata_Indicator') && k.toLowerCase().endsWith('.csv')
	);
	const metaMap = new Map<string, { sourceNote: string; sourceOrg: string }>();

	if (metaKey && unzippedFiles[metaKey]) {
		const metaCsv = unzippedFiles[metaKey].toString('utf8');
		const metaRows = parseCSV(metaCsv);
		for (let i = 1; i < metaRows.length; i++) {
			const row = metaRows[i];
			if (row && row.length >= 4) {
				const code = row[0].replace(/^\uFEFF/, '').trim();
				metaMap.set(code, {
					sourceNote: row[2]?.trim() || '',
					sourceOrg: row[3]?.trim() || ''
				});
			}
		}
	}

	// Find the main data CSV dynamically (starts with API_ or ends with .csv and not Metadata)
	const dataKey =
		fileKeys.find(
			(k) =>
				k.startsWith('API_') &&
				k.toLowerCase().endsWith('.csv') &&
				!k.includes('Metadata')
		) ||
		fileKeys.find(
			(k) => k.toLowerCase().endsWith('.csv') && !k.includes('Metadata')
		);

	if (!dataKey || !unzippedFiles[dataKey]) {
		throw new Error(
			`Could not find primary data CSV in zip archive '${zipInfo.filename}'. Expected a file starting with API_...`
		);
	}

	const dataCsv = unzippedFiles[dataKey].toString('utf8');
	const csvRows = parseCSV(dataCsv);

	// Locate header line
	let headerIdx = -1;
	for (let i = 0; i < Math.min(15, csvRows.length); i++) {
		if (csvRows[i] && csvRows[i][0] && csvRows[i][0].includes('Country Name')) {
			headerIdx = i;
			break;
		}
	}

	if (headerIdx === -1) {
		throw new Error(
			`Header row ('Country Name') not found in CSV from '${zipInfo.filename}'`
		);
	}

	const headers = csvRows[headerIdx];
	const yearColumns: { year: number; colIdx: number }[] = [];
	for (let c = 4; c < headers.length; c++) {
		const y = parseInt(headers[c]?.trim(), 10);
		if (!isNaN(y) && y >= 1950 && y <= 2040) {
			yearColumns.push({ year: y, colIdx: c });
		}
	}

	// Detect country name and code dynamically
	let countryName = 'Kyrgyz Republic';
	let countryCode = 'KGZ';
	if (csvRows.length > headerIdx + 1 && csvRows[headerIdx + 1].length >= 2) {
		countryName =
			csvRows[headerIdx + 1][0]?.replace(/^\uFEFF/, '').trim() || countryName;
		countryCode = csvRows[headerIdx + 1][1]?.trim() || countryCode;
	}

	const indicators = new Map<string, IndicatorFull>();
	const categoryCounts = new Map<string, number>();

	for (let r = headerIdx + 1; r < csvRows.length; r++) {
		const row = csvRows[r];
		if (!row || row.length < 5) continue;

		const name = row[2]?.trim();
		const code = row[3]?.trim();
		if (!name || !code) continue;

		const history: DataPoint[] = [];
		for (const { year, colIdx } of yearColumns) {
			const rawVal = row[colIdx];
			if (rawVal !== undefined && rawVal.trim() !== '') {
				const num = parseFloat(rawVal);
				if (!isNaN(num)) {
					history.push({ year, value: num });
				}
			}
		}

		if (history.length === 0) continue;

		history.sort((a, b) => a.year - b.year);

		const values = history.map((h) => h.value);
		const count = history.length;
		const firstYear = history[0].year;
		const lastYear = history[count - 1].year;
		const latestValue = history[count - 1].value;
		const previousValue = count > 1 ? history[count - 2].value : undefined;
		const yoyChange =
			previousValue !== undefined ? latestValue - previousValue : undefined;
		const yoyPercent =
			previousValue !== undefined && previousValue !== 0
				? ((latestValue - previousValue) / Math.abs(previousValue)) * 100
				: undefined;

		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);
		const avgValue = values.reduce((sum, v) => sum + v, 0) / count;

		const category = determineCategory(code, name);
		categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

		const meta = metaMap.get(code);
		const shortTitle = ESSENTIAL_INDICATORS[code];
		const isEssential = Boolean(shortTitle);

		const indicatorFull: IndicatorFull = {
			code,
			name,
			shortTitle,
			isEssential,
			category,
			count,
			firstYear,
			lastYear,
			latestValue,
			previousValue,
			yoyChange,
			yoyPercent,
			minValue,
			maxValue,
			avgValue,
			sourceNote: meta?.sourceNote,
			sourceOrg: meta?.sourceOrg,
			history
		};

		indicators.set(code, indicatorFull);
	}

	const catalog: IndicatorMeta[] = Array.from(indicators.values()).map(
		({ history, ...meta }) => meta
	);

	// Sort catalog: essentials first, then alphabetically
	catalog.sort((a, b) => {
		if (a.isEssential && !b.isEssential) return -1;
		if (!a.isEssential && b.isEssential) return 1;
		return a.name.localeCompare(b.name);
	});

	const categories: CategorySummary[] = Array.from(categoryCounts.entries())
		.map(([name, count]) => ({
			name,
			count,
			icon: getCategoryIcon(name)
		}))
		.sort((a, b) => b.count - a.count);

	// Curate strictly the 8 core essential macro indicators
	const essentialCodes = Object.keys(ESSENTIAL_INDICATORS);
	const featured: IndicatorFull[] = [];
	for (const code of essentialCodes) {
		const ind = indicators.get(code);
		if (ind) {
			featured.push(ind);
		}
	}

	cachedMtime = zipInfo.mtimeMs;
	cachedZipName = zipInfo.filename;
	cachedData = {
		countryName,
		countryCode,
		zipFilename: zipInfo.filename,
		indicators,
		catalog,
		categories,
		featured
	};

	console.log(
		`[WorldBank] Auto-loaded '${zipInfo.filename}' (${countryName}): ${indicators.size} indicators in ${Date.now() - startTime}ms`
	);

	return cachedData;
}
