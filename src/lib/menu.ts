export type Addon = {
	id: string;
	name: string;
	price: number;
};

export type MenuItem = {
	id: string;
	name: string;
	price: number | string;
	description?: string;
	image?: string;
};

export type MenuCategory = {
	id: string;
	category: string;
	items: MenuItem[];
};

export type MenuData = {
	categories: MenuCategory[];
	addonsByCategory: Record<string, Addon[]>;
	pairingsByCategory: Record<string, string[]>;
};

export function getAddons(menu: MenuData, categoryId: string): Addon[] {
	return menu.addonsByCategory[categoryId] ?? [];
}

export function getRecommendations(menu: MenuData, itemId: string, count = 4): MenuItem[] {
	const category = menu.categories.find((c) => c.items.some((i) => i.id === itemId));
	if (!category) return [];

	const itemMap = new Map(menu.categories.flatMap((c) => c.items.map((i) => [i.id, i])));
	const pairingIds = menu.pairingsByCategory[category.id] ?? [];
	const paired = pairingIds
		.map((id) => itemMap.get(id))
		.filter((it): it is MenuItem => it !== undefined && it.id !== itemId);

	if (paired.length >= count) return paired.slice(0, count);

	const seen = new Set([itemId, ...paired.map((p) => p.id)]);
	const fillers = category.items.filter((i) => !seen.has(i.id));
	const fromOthers = menu.categories
		.filter((c) => c.id !== category.id)
		.flatMap((c) => c.items)
		.filter((i) => !seen.has(i.id));

	const result: MenuItem[] = [...paired];
	for (const it of [...fillers, ...fromOthers]) {
		if (result.length >= count) break;
		result.push(it);
	}
	return result;
}

export function getCategoryForItem(menu: MenuData, itemId: string): string | null {
	return menu.categories.find((c) => c.items.some((i) => i.id === itemId))?.id ?? null;
}

export function formatPrice(price: number | string): string {
	return `${price} ₽`;
}
