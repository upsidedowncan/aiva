import { json, type RequestHandler } from '@sveltejs/kit';
import { updateItem, addItem, deleteItem } from '$lib/server/menu-store';
import type { MenuItem } from '$lib/menu';

export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.isAdmin) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = (await request.json().catch(() => null)) as {
		categoryId: string;
		itemId: string;
		patch: Partial<MenuItem>;
	} | null;

	if (!body?.categoryId || !body?.itemId || !body.patch) {
		return json({ error: 'Неверные данные' }, { status: 400 });
	}

	const updated = updateItem(body.categoryId, body.itemId, body.patch);
	if (!updated) return json({ error: 'Позиция не найдена' }, { status: 404 });
	return json(updated);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.isAdmin) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = (await request.json().catch(() => null)) as {
		categoryId: string;
		item: MenuItem;
	} | null;

	if (!body?.categoryId || !body?.item) {
		return json({ error: 'Неверные данные' }, { status: 400 });
	}

	const created = addItem(body.categoryId, body.item);
	if (!created) return json({ error: 'Не удалось создать' }, { status: 400 });
	return json(created);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.isAdmin) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = (await request.json().catch(() => null)) as {
		categoryId: string;
		itemId: string;
	} | null;

	if (!body?.categoryId || !body?.itemId) {
		return json({ error: 'Неверные данные' }, { status: 400 });
	}

	const ok = deleteItem(body.categoryId, body.itemId);
	if (!ok) return json({ error: 'Позиция не найдена' }, { status: 404 });
	return json({ ok: true });
};
