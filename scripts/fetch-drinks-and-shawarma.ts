const API_KEY = 'tZl_bjOeVEmK6j42q6o7Esr3M5kOw5CTX9MCVjxGW5M';
const BASE = 'https://api.unsplash.com';
const OUT = 'static/images';

type Photo = {
	id: string;
	urls: { regular: string; small: string };
	alt_description: string | null;
	user: { name: string };
	width: number;
	height: number;
};

async function search(query: string, perPage = 10, page = 1): Promise<Photo[]> {
	const url = `${BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape&content_filter=high`;
	const res = await fetch(url, { headers: { Authorization: `Client-ID ${API_KEY}` } });
	if (!res.ok) throw new Error(`search ${query}: ${res.status}`);
	const data = (await res.json()) as { results: Photo[] };
	return data.results;
}

async function download(photo: Photo, name: string) {
	const url = `${photo.urls.regular}&w=480&h=480&fit=crop&q=70`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`download ${name}: ${res.status}`);
	const buf = new Uint8Array(await res.arrayBuffer());
	await Bun.write(`${OUT}/${name}.jpg`, buf);
	console.log(
		`  ${name}.jpg  (${(buf.length / 1024).toFixed(0)} KB)  — ${photo.alt_description ?? '?'} / ${photo.user.name}`
	);
}

async function bestPick(queries: string[], exclude: RegExp = /burger|pizza|hamburger/i) {
	const pool: Photo[] = [];
	for (const q of queries) {
		const results = await search(q, 15, 1);
		pool.push(...results);
		await new Promise((r) => setTimeout(r, 150));
	}
	const clean = pool.filter((p) => p.alt_description && !exclude.test(p.alt_description));
	if (clean.length > 0) return clean[0];
	return pool[0];
}

const tasks: Array<{ name: string; queries: string[]; exclude?: RegExp }> = [
	{ name: 'shaurma-tandyr', queries: ['döner kebab', 'shawarma wrap', 'turkish kebab roll'] },
	{
		name: 'shaurma-bulka',
		queries: ['shawarma bread roll', 'kebab bun', 'turkish sandwich bread'],
		exclude: /burger/i
	},
	{ name: 'shaurma-lavash', queries: ['lavash wrap', 'chicken wrap', 'donair wrap'] },
	{ name: 'shaurma-meksika', queries: ['mexican burrito', 'spicy burrito', 'chicken burrito'] },
	{ name: 'shaurma-syrnaya', queries: ['cheese burrito', 'cheesy wrap', 'quesadilla'] },
	{ name: 'shaurma-max', queries: ['large kebab wrap', 'big donair', 'giant shawarma'] },
	{ name: 'shaurma-klyar', queries: ['fried wrap', 'crispy burrito', 'tempura wrap'] },
	{ name: 'shaurma-tarelka', queries: ['kebab plate', 'donair plate', 'shawarma plate'] },
	{ name: 'shaurma-govyadina', queries: ['beef shawarma', 'beef donair', 'beef kebab wrap'] },
	{ name: 'shaurma-assorti', queries: ['mixed kebab', 'kebab platter', 'assorted wraps'] },
	{ name: 'shaurma-detskaya', queries: ['mini wrap', 'small kebab', 'kids wrap'] },
	{ name: 'durum-kurinyy', queries: ['dürüm wrap', 'chicken dürüm', 'thin kebab wrap'] },
	{ name: 'durum-myasnoy', queries: ['dürüm meat', 'beef dürüm', 'meat dürüm wrap'] },
	{ name: 'hot-dog', queries: ['hot dog bun', 'classic hotdog', 'american hotdog'] },
	{ name: 'hot-dog-dvoynoy', queries: ['double hot dog', 'twin hotdog', 'two hotdogs'] },
	{ name: 'hot-dog-naggetsy', queries: ['hot dog with nuggets', 'hotdog meal', 'hotdog combo'] },
	{ name: 'hot-dog-lavash', queries: ['hotdog in wrap', 'sausage wrap', 'hotdog lavash'] },

	{ name: 'chay', queries: ['black tea cup', 'tea cup', 'chai tea'] },
	{ name: 'chay-zelenyy', queries: ['green tea cup', 'matcha tea', 'green tea glass'] },
	{ name: 'kofe-amerikano', queries: ['americano coffee', 'black coffee cup', 'espresso cup'] },
	{
		name: 'kofe-kapuchino',
		queries: ['cappuccino cup', 'cappuccino latte art', 'cappuccino coffee']
	},
	{ name: 'kofe-latte', queries: ['latte coffee', 'latte art cup', 'caffe latte'] },
	{ name: 'ayran', queries: ['ayran drink', 'turkish yogurt drink', 'kefir drink glass'] },
	{ name: 'cola', queries: ['cola glass', 'coca cola drink', 'soda glass ice'] },
	{ name: 'fanta', queries: ['orange soda', 'fanta glass', 'orange drink'] },
	{ name: 'sprite', queries: ['lemon lime soda', 'sprite glass', 'lemon soda'] },
	{ name: 'limonad', queries: ['lemonade glass', 'homemade lemonade', 'lemon drink'] },
	{ name: 'kompot', queries: ['fruit compote', 'berry drink', 'fruit punch glass'] },
	{ name: 'sok-apelsin', queries: ['orange juice glass', 'fresh orange juice', 'oj glass'] },
	{ name: 'sok-yabloko', queries: ['apple juice glass', 'fresh apple juice', 'apple cider'] },
	{ name: 'sok-vishnya', queries: ['cherry juice', 'cherry drink glass', 'cherry compote'] },
	{ name: 'voda', queries: ['water bottle', 'mineral water', 'sparkling water glass'] },
	{
		name: 'molochnyy-kokteyl',
		queries: ['milkshake glass', 'milkshake straw', 'chocolate milkshake']
	}
];

let success = 0;
for (const task of tasks) {
	try {
		const photo = await bestPick(task.queries, task.exclude);
		if (!photo) {
			console.warn(`  ! no photo for ${task.name}`);
			continue;
		}
		await download(photo, task.name);
		success++;
		await new Promise((r) => setTimeout(r, 200));
	} catch (e) {
		console.error(`  x ${task.name}: ${(e as Error).message}`);
	}
}

console.log(`\nDONE — ${success}/${tasks.length} images updated`);
