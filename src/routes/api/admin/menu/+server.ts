import { json, type RequestHandler } from '@sveltejs/kit';
import { getMenu } from '$lib/server/menu-store';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.isAdmin) return json({ error: 'Unauthorized' }, { status: 401 });
	return json(getMenu());
};
