import type { PageServerLoad } from './$types';
import { getMenu } from '$lib/server/menu-store';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		menu: getMenu(),
		isAdmin: locals.isAdmin
	};
};
