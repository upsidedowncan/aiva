import { json, type RequestHandler } from '@sveltejs/kit';
import { recordPresence } from '$lib/server/presence';

export const POST: RequestHandler = async ({ cookies, request }) => {
	let id = cookies.get('aiva_visitor');
	if (!id) {
		id = crypto.randomUUID();
		cookies.set('aiva_visitor', id, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30
		});
	}
	recordPresence(id);
	return json({ ok: true });
};
