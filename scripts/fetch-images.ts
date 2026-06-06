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

async function search(query: string, perPage = 10): Promise<Photo[]> {
	const url = `${BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`;
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

const queries: Record<string, number> = {
	burger: 12,
	shawarma: 6,
	'lavash wrap': 4,
	'hot dog': 5,
	'french fries': 3,
	'kebab shish': 5,
	'grilled chicken wings': 3,
	'grilled mushrooms': 2,
	'caesar salad': 2,
	salad: 3,
	'rice pilaf plov': 3,
	'grilled fish': 2,
	'grilled tomato': 1,
	'roasted potatoes': 2,
	nuggets: 2,
	'grilled chicken': 2,
	'vegetable platter': 2,
	durum: 3
};

const pool: Record<string, Photo[]> = {};

for (const [q, n] of Object.entries(queries)) {
	try {
		const results = await search(q, n);
		pool[q] = results;
		console.log(`${q}: ${results.length} results`);
	} catch (e) {
		console.error(`${q}: ${(e as Error).message}`);
	}
	await new Promise((r) => setTimeout(r, 200));
}

let idx = 0;
function pick(q: string): Photo | undefined {
	const list = pool[q];
	if (!list || list.length === 0) return undefined;
	const photo = list[idx % list.length];
	idx++;
	return photo;
}

const burgerPhotos = pool['burger'] ?? [];
let bi = 0;
function burger() {
	const p = burgerPhotos[bi % burgerPhotos.length];
	bi++;
	return p;
}

const shawarmaPhotos = pool['shawarma'] ?? [];
let si = 0;
function shawarma() {
	const p = shawarmaPhotos[si % shawarmaPhotos.length];
	si++;
	return p;
}

const hotdogPhotos = pool['hot dog'] ?? [];
let hi = 0;
function hotdog() {
	const p = hotdogPhotos[hi % hotdogPhotos.length];
	hi++;
	return p;
}

const durumPhotos = pool['durum'] ?? [];
let di = 0;
function durum() {
	const p = durumPhotos[di % durumPhotos.length];
	di++;
	return p;
}

const mapping: Record<string, [string, () => Photo | undefined]> = {
	afonya: ['afonya', burger],
	'tsypa-mery': ['tsypa-mery', burger],
	'gril-chiken': ['gril-chiken', burger],
	pepperoni: ['pepperoni', burger],
	'shef-miks': ['shef-miks', burger],
	tehasets: ['tehasets', burger],
	'syr-da-myaso': ['syr-da-myaso', burger],
	ayva: ['ayva', burger],
	'buynakskiy-paren': ['buynakskiy-paren', burger],

	'shaurma-tandyr': ['shaurma-tandyr', shawarma],
	'shaurma-bulka': ['shaurma-bulka', shawarma],
	'shaurma-lavash': ['shaurma-lavash', shawarma],
	'shaurma-meksika': ['shaurma-meksika', shawarma],
	'shaurma-syrnaya': ['shaurma-syrnaya', shawarma],
	'shaurma-max': ['shaurma-max', shawarma],
	'shaurma-klyar': ['shaurma-klyar', shawarma],
	'shaurma-tarelka': ['shaurma-tarelka', shawarma],
	'shaurma-govyadina': ['shaurma-govyadina', shawarma],
	'shaurma-assorti': ['shaurma-assorti', shawarma],
	'shaurma-detskaya': ['shaurma-detskaya', shawarma],
	'durum-kurinyy': ['durum-kurinyy', durum],
	'durum-myasnoy': ['durum-myasnoy', durum],
	'hot-dog': ['hot-dog', hotdog],
	'hot-dog-dvoynoy': ['hot-dog-dvoynoy', hotdog],
	'hot-dog-naggetsy': ['hot-dog-naggetsy', hotdog],
	'hot-dog-lavash': ['hot-dog-lavash', hotdog],

	'fri-standart': ['fri-standart', () => pick('french fries')],
	'fri-bolshoy': ['fri-bolshoy', () => pick('french fries')],
	'kartofel-derevenskiy': ['kartofel-derevenskiy', () => pick('roasted potatoes')],
	naggetsy: ['naggetsy', () => pick('nuggets')],
	'shashlyk-govyadina': ['shashlyk-govyadina', () => pick('kebab shish')],
	'shashlyk-kurinyy': ['shashlyk-kurinyy', () => pick('kebab shish')],
	'lulya-kebab-govyadina': ['lulya-kebab-govyadina', () => pick('kebab shish')],
	'lulya-kebab-kuritsa': ['lulya-kebab-kuritsa', () => pick('kebab shish')],
	'ostrye-krylyshki': ['ostrye-krylyshki', () => pick('grilled chicken wings')],
	'griby-mangal': ['griby-mangal', () => pick('grilled mushrooms')],
	'kartoshka-kurdyuk': ['kartoshka-kurdyuk', () => pick('roasted potatoes')],
	'tomaty-mangal': ['tomaty-mangal', () => pick('grilled tomato')],
	skumbriya: ['skumbriya', () => pick('grilled fish')],
	'uzbekskiy-plov': ['uzbekskiy-plov', () => pick('rice pilaf plov')],
	'salat-tsezar': ['salat-tsezar', () => pick('caesar salad')],
	'salat-domashniy': ['salat-domashniy', () => pick('salad')],
	'salat-turetski': ['salat-turetski', () => pick('salad')],
	ovoshchnaya: ['ovoshchnaya-narezka', () => pick('vegetable platter')],
	'kuritsa-ugli': ['kuritsa-ugli', () => pick('grilled chicken')]
};

console.log('\n--- downloading ---');
const mapOut: Record<string, string> = {};
for (const [key, [filename, fn]] of Object.entries(mapping)) {
	const photo = fn();
	if (!photo) {
		console.warn(`  ! no photo for ${key}`);
		continue;
	}
	try {
		await download(photo, filename);
		mapOut[key] = `/images/${filename}.jpg`;
	} catch (e) {
		console.error(`  x ${key}: ${(e as Error).message}`);
	}
	await new Promise((r) => setTimeout(r, 150));
}

await Bun.write('scripts/image-map.json', JSON.stringify(mapOut, null, 2));
console.log(`\nDONE — ${Object.keys(mapOut).length} images`);
