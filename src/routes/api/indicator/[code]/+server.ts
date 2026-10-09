import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWorldBankData } from '#lib/server/worldbank';

export const GET: RequestHandler = ({ params }) => {
	const code = params.code;
	if (!code) {
		throw error(400, 'Indicator code is required');
	}

	const data = getWorldBankData();
	const indicator = data.indicators.get(code);

	if (!indicator) {
		throw error(404, `Indicator '${code}' not found`);
	}

	return json(indicator);
};
