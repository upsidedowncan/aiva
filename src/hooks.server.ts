import type { Handle } from '@sveltejs/kit';
import { verifySessionJwt, ensureInitialized } from '$lib/server/auth';

await ensureInitialized();

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('aiva_admin');
	event.locals.isAdmin = await verifySessionJwt(token);

	const response = await resolve(event);
	return response;
};
