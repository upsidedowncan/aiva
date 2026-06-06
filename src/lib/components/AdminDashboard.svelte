<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { easeOutQuart } from '$lib/easing';

	type Metrics = { live: number; today: number; orders: number; updatedAt: number };

	let metrics = $state<Metrics>({ live: 0, today: 0, orders: 0, updatedAt: 0 });
	let loading = $state(true);
	let lastFetch = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;

	async function fetchMetrics() {
		try {
			const res = await fetch('/api/admin/metrics');
			if (!res.ok) return;
			metrics = (await res.json()) as Metrics;
			lastFetch = Date.now();
		} catch {
			/* offline */
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchMetrics();
		timer = setInterval(fetchMetrics, 30_000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	const sinceUpdate = $derived(() => {
		if (!lastFetch) return '';
		const s = Math.floor((Date.now() - lastFetch) / 1000);
		if (s < 5) return 'только что';
		if (s < 60) return `${s}с назад`;
		return `${Math.floor(s / 60)}мин назад`;
	});

	const liveDotClass = $derived(
		metrics.live > 0 ? 'bg-olive-500 shadow-olive-500/50' : 'bg-olive-300'
	);
</script>

<div class="grid grid-cols-3 gap-3" in:fly={{ y: 8, duration: 480, easing: easeOutQuart }}>
	<div class="relative overflow-hidden rounded-2xl border border-olive-200 bg-white p-4 shadow-sm">
		<div class="flex items-center gap-2">
			<span class="relative flex h-2 w-2">
				<span class="absolute inset-0 animate-ping rounded-full {liveDotClass} opacity-75"></span>
				<span class="relative inline-flex h-2 w-2 rounded-full {liveDotClass}"></span>
			</span>
			<span class="text-xs font-medium tracking-wide text-olive-500 uppercase">Сейчас</span>
		</div>
		<div class="mt-2 font-mono text-3xl font-semibold text-olive-900 tabular-nums">
			{loading ? '—' : metrics.live}
		</div>
		<div class="text-xs text-olive-500">на сайте</div>
	</div>

	<div class="rounded-2xl border border-olive-200 bg-white p-4 shadow-sm">
		<div class="flex items-center gap-2">
			<svg
				width="12"
				height="12"
				viewBox="0 0 14 14"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-olive-500"
			>
				<path d="M2 4h10M2 7h10M2 10h7" />
			</svg>
			<span class="text-xs font-medium tracking-wide text-olive-500 uppercase">За 24ч</span>
		</div>
		<div class="mt-2 font-mono text-3xl font-semibold text-olive-900 tabular-nums">
			{loading ? '—' : metrics.today}
		</div>
		<div class="text-xs text-olive-500">уник. посетителей</div>
	</div>

	<div class="rounded-2xl border border-olive-200 bg-white p-4 shadow-sm">
		<div class="flex items-center gap-2">
			<svg
				width="12"
				height="12"
				viewBox="0 0 14 14"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-olive-500"
			>
				<path d="M2 5h10l-1 6H3L2 5zM5 5V3a2 2 0 0 1 4 0v2" />
			</svg>
			<span class="text-xs font-medium tracking-wide text-olive-500 uppercase">Заказы</span>
		</div>
		<div class="mt-2 font-mono text-3xl font-semibold text-olive-900 tabular-nums">
			{loading ? '—' : metrics.orders}
		</div>
		<div class="text-xs text-olive-500">оформлено</div>
	</div>
</div>
