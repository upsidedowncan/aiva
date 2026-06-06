const API_KEY = 'tZl_bjOeVEmK6j42q6o7Esr3M5kOw5CTX9MCVjxGW5M';
const BASE = 'https://api.unsplash.com';
const OUT = 'static/images';

type Photo = {
	id: string;
	urls: { regular: string };
	alt_description: string | null;
	user: { name: string };
};

async function search(query: string, perPage = 10, page = 1): Promise<Photo[]> {
	const url = `${BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape&content_filter=high`;
	const res = await fetch(url, { headers: { Authorization: `Client-ID ${API_KEY}` } });
	if (!res.ok) throw new Error(`${query}: ${res.status}`);
	return ((await res.json()) as { results: Photo[] }).results;
}

async function download(photo: Photo, name: string) {
	const url = `${photo.urls.regular}&w=480&h=480&fit=crop&q=70`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${name}: ${res.status}`);
	const buf = new Uint8Array(await res.arrayBuffer());
	await Bun.write(`${OUT}/${name}.jpg`, buf);
	console.log(
		`  ${name}.jpg  (${(buf.length / 1024).toFixed(0)} KB)  — ${photo.alt_description ?? '?'} / ${photo.user.name}`
	);
}

const tasks: Array<{ name: string; query: string }> = [
	{ name: 'chay', query: 'chai tea glass' },
	{ name: 'chay-zelenyy', query: 'matcha latte' },
	{ name: 'kofe-amerikano', query: 'americano coffee' },
	{ name: 'kofe-kapuchino', query: 'cappuccino' },
	{ name: 'kofe-latte', query: 'latte art' },
	{ name: 'ayran', query: 'ayran' },
	{ name: 'cola', query: 'cola drink' },
	{ name: 'fanta', query: 'fanta orange soda' },
	{ name: 'sprite', query: 'sprite drink' },
	{ name: 'limonad', query: 'lemonade' },
	{ name: 'kompot', query: 'fruit punch' },
	{ name: 'sok-apelsin', query: 'orange juice' },
	{ name: 'sok-yabloko', query: 'apple juice' },
	{ name: 'sok-vishnya', query: 'cherry juice' },
	{ name: 'voda', query: 'water bottle' },
	{ name: 'molochnyy-kokteyl', query: 'milkshake' }
];

let success = 0;
for (const task of tasks) {
	try {
		const r = await search(task.query, 5, 1);
		if (r.length === 0) {
			console.warn(`  ! no photo for ${task.name}`);
			continue;
		}
		await download(r[0], task.name);
		success++;
	} catch (e) {
		console.error(`  x ${task.name}: ${(e as Error).message}`);
	}
	await new Promise((r) => setTimeout(r, 2000));
}

console.log(`\nDONE — ${success}/${tasks.length} images`);
