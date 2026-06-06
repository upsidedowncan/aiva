import { json, type RequestHandler } from '@sveltejs/kit';
import { verifyPassword, createSessionJwt } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = (await request.json().catch(() => null)) as { password?: string } | null;
	const password = body?.password;

	if (!password || typeof password !== 'string') {
		return json({ error: 'Пароль не указан' }, { status: 400 });
	}

	const ok = await verifyPassword(password);
	if (!ok) {
		return json({ error: 'Неверный пароль' }, { status: 401 });
	}

	const jwt = await createSessionJwt();
	cookies.set('aiva_admin', jwt, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 7
	});

	return json({ ok: true });
};
