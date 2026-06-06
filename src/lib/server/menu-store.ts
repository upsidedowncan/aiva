import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import defaultMenu from '../../../data/menu.json';

const DATA_DIR = 'data';
const MENU_FILE = join(DATA_DIR, 'menu.json');

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

let cache: MenuData | null = null;

function load(): MenuData {
	if (cache) return cache;
	try {
		if (existsSync(MENU_FILE)) {
			const raw = readFileSync(MENU_FILE, 'utf-8');
			cache = JSON.parse(raw) as MenuData;
			return cache;
		}
	} catch {
		// fall through to bundled default
	}
	cache = structuredClone(defaultMenu) as MenuData;
	return cache;
}

function save(data: MenuData) {
	cache = data;
	try {
		writeFileSync(MENU_FILE, JSON.stringify(data, null, 2) + '\n');
	} catch {
		// read-only filesystem (e.g. serverless): keep in-memory only
	}
}

export function getMenu(): MenuData {
	return load();
}

export function updateItem(
	categoryId: string,
	itemId: string,
	patch: Partial<MenuItem>
): MenuItem | null {
	const data = load();
	const cat = data.categories.find((c) => c.id === categoryId);
	if (!cat) return null;
	const idx = cat.items.findIndex((i) => i.id === itemId);
	if (idx === -1) return null;
	const merged: MenuItem = { ...cat.items[idx], ...patch, id: cat.items[idx].id };
	cat.items[idx] = merged;
	save(data);
	return merged;
}

export function addItem(categoryId: string, item: MenuItem): MenuItem | null {
	const data = load();
	const cat = data.categories.find((c) => c.id === categoryId);
	if (!cat) return null;
	if (cat.items.some((i) => i.id === item.id)) return null;
	cat.items.push(item);
	save(data);
	return item;
}

export function deleteItem(categoryId: string, itemId: string): boolean {
	const data = load();
	const cat = data.categories.find((c) => c.id === categoryId);
	if (!cat) return false;
	const before = cat.items.length;
	cat.items = cat.items.filter((i) => i.id !== itemId);
	if (cat.items.length === before) return false;
	save(data);
	return true;
}
