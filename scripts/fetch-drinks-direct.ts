const OUT = 'static/images';

async function check(id: string): Promise<boolean> {
	const res = await fetch(`https://images.unsplash.com/photo-${id}?w=480&h=480&fit=crop&q=70`, {
		method: 'HEAD'
	});
	return res.ok;
}

async function dl(photoId: string, name: string) {
	const url = `https://images.unsplash.com/photo-${photoId}?w=480&h=480&fit=crop&q=70`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${name}: ${res.status}`);
	const buf = new Uint8Array(await res.arrayBuffer());
	await Bun.write(`${OUT}/${name}.jpg`, buf);
	console.log(`  ${name}.jpg  (${(buf.length / 1024).toFixed(0)} KB)`);
}

const candidates: Array<{ name: string; ids: string[] }> = [
	{
		name: 'kofe-kapuchino',
		ids: ['1572442388796-11668a67e53d', '1559496417-e7f25cb247f3', '1509042239860-f550ce710b93']
	},
	{
		name: 'kofe-latte',
		ids: ['1561889908-0c0a77b0db2c', '1572442388796-11668a67e53d', '1509042239860-f550ce710b93']
	},
	{ name: 'kofe-amerikano', ids: ['1559496417-e7f25cb247f3', '1509042239860-f550ce710b93'] },
	{
		name: 'chay-zelenyy',
		ids: ['1515442261605-65987783cb6a', '1556679343-c7306c1976bc', '1544787219-7f47ccb76574']
	},
	{
		name: 'fanta',
		ids: ['1624555093333-9e1c0c7b9d2e', '1622483767028-3f66f32aef97', '1437418747212-8d9709afab22']
	},
	{
		name: 'sprite',
		ids: ['1556881286-fc6915169721', '1622483767028-3f66f32aef97', '1437418747212-8d9709afab22']
	},
	{
		name: 'sok-yabloko',
		ids: ['1576673442511-7b39b1345b81', '1613478223719-2ab802602423', '1568901346375-23c9450c58cd']
	},
	{ name: 'sok-vishnya', ids: ['1551024506-0bccd828d307', '1613478223719-2ab802602423'] },
	{
		name: 'kompot',
		ids: ['1499638673689-79a0b5115d87', '1622483767028-3f66f32aef97', '1613478223719-2ab802602423']
	},
	{ name: 'ayran', ids: ['1601050690597-df0568f70950', '1597318078832-fd6d1b7e3d2c'] },
	{ name: 'cola', ids: ['1622483767028-3f66f32aef97', '1556881286-fc6915169721'] },
	{ name: 'limonad', ids: ['1499638673689-79a0b5115d87', '1622483767028-3f66f32aef97'] },
	{ name: 'voda', ids: ['1559839734-2b71ea197ec2', '1523362628745-0c100150b504'] },
	{ name: 'molochnyy-kokteyl', ids: ['1568901346375-23c9450c58cd', '1568051243859-29f1c2bf6e2c'] },
	{ name: 'sok-apelsin', ids: ['1613478223719-2ab802602423', '1600271886742-f049cd451bba'] },
	{ name: 'chay', ids: ['1544787219-7f47ccb76574', '1576092768241-dec231879fc3'] }
];

let success = 0;
for (const task of candidates) {
	let picked: string | null = null;
	for (const id of task.ids) {
		if (await check(id)) {
			picked = id;
			break;
		}
	}
	if (!picked) {
		console.warn(`  ! no valid ID for ${task.name}`);
		continue;
	}
	try {
		await dl(picked, task.name);
		success++;
	} catch (e) {
		console.error(`  x ${task.name}: ${(e as Error).message}`);
	}
}

console.log(`\nDONE — ${success}/${candidates.length} images`);
