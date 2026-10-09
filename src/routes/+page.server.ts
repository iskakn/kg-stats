import type { PageServerLoad } from './$types';
import { getWorldBankData } from '#lib/server/worldbank';

export const load: PageServerLoad = async ({ url }) => {
	const data = getWorldBankData();

	const requestedCode = url.searchParams.get('indicator');
	const defaultCode = 'NY.GDP.MKTP.CD';
	const initialIndicator =
		(requestedCode && data.indicators.get(requestedCode)) ||
		data.indicators.get(defaultCode) ||
		data.featured[0];

	return {
		countryName: data.countryName,
		countryCode: data.countryCode,
		zipFilename: data.zipFilename,
		categories: data.categories,
		featured: data.featured,
		catalog: data.catalog,
		initialIndicator,
		totalCount: data.indicators.size
	};
};
