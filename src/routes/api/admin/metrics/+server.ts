import { json, type RequestHandler } from '@sveltejs/kit';
import { getMetrics } from '$lib/server/presence';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.isAdmin) return json({ error: 'Unauthorized' }, { status: 401 });
	return json(getMetrics());
};
