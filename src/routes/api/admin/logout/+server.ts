import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('aiva_admin', { path: '/' });
	return json({ ok: true });
};
