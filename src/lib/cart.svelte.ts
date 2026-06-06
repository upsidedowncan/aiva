import type { Addon, MenuItem } from './menu';

export type CartLine = {
	id: string;
	item: MenuItem;
	qty: number;
	addons: Addon[];
};

const STORAGE_KEY = 'aiva_cart_v1';

function load(): CartLine[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as { lines?: CartLine[]; counter?: number };
		if (typeof parsed.counter === 'number') lineCounter = Math.max(lineCounter, parsed.counter);
		return Array.isArray(parsed.lines) ? parsed.lines : [];
	} catch {
		return [];
	}
}

function persist(lines: CartLine[]) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, counter: lineCounter }));
	} catch {
		/* quota / disabled */
	}
}

let lineCounter = 0;

export class Cart {
	lines = $state<CartLine[]>(load());

	private save() {
		persist(this.lines);
	}

	add(item: MenuItem, qty = 1, addons: Addon[] = []) {
		if (qty <= 0) return;
		const line: CartLine = {
			id: `l${++lineCounter}`,
			item: { ...item },
			qty,
			addons: addons.map((a) => ({ ...a }))
		};
		this.lines.push(line);
		this.save();
	}

	remove(itemId: string) {
		for (let i = this.lines.length - 1; i >= 0; i--) {
			const line = this.lines[i];
			if (!line || line.item.id !== itemId) continue;
			if (line.qty <= 1) {
				this.lines.splice(i, 1);
			} else {
				line.qty -= 1;
			}
			this.save();
			return;
		}
	}

	incLine(lineId: string) {
		const line = this.lines.find((l) => l.id === lineId);
		if (line) {
			line.qty += 1;
			this.save();
		}
	}

	decLine(lineId: string) {
		const idx = this.lines.findIndex((l) => l.id === lineId);
		if (idx === -1) return;
		const line = this.lines[idx];
		if (!line) return;
		if (line.qty <= 1) {
			this.lines.splice(idx, 1);
		} else {
			line.qty -= 1;
		}
		this.save();
	}

	removeLine(lineId: string) {
		const idx = this.lines.findIndex((l) => l.id === lineId);
		if (idx === -1) return;
		this.lines.splice(idx, 1);
		this.save();
	}

	clear() {
		this.lines.length = 0;
		this.save();
	}

	get count(): number {
		return this.lines.reduce((sum, l) => sum + l.qty, 0);
	}

	lineTotal(line: CartLine): number {
		const itemPrice = typeof line.item.price === 'number' ? line.item.price : 0;
		const addonsPrice = line.addons.reduce((s, a) => s + a.price, 0);
		return (itemPrice + addonsPrice) * line.qty;
	}

	get total(): number {
		return this.lines.reduce((sum, l) => sum + this.lineTotal(l), 0);
	}

	getQty(itemId: string): number {
		return this.lines.filter((l) => l.item.id === itemId).reduce((s, l) => s + l.qty, 0);
	}
}
