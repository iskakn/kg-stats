import type { PageServerLoad } from './$types';
import { getWorldBankData } from '#lib/server/worldbank';

export const load: PageServerLoad = async () => {
	const data = getWorldBankData();

	const defaultCode = 'NY.GDP.MKTP.CD';
	const initialIndicator = data.indicators.get(defaultCode) || data.featured[0];

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
