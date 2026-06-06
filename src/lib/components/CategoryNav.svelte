<script lang="ts">
	import type { MenuData } from '$lib/menu';
	import { Tween } from 'svelte/motion';
	import { easeOutQuart } from '$lib/easing';

	let { menu }: { menu: MenuData } = $props();

	let activeId = $state(menu.categories[0]?.id ?? '');
	let buttons: Record<string, HTMLButtonElement | null> = $state({});
	let initialized = $state(false);

	let activeBtn = $derived(buttons[activeId]);

	const tweenX = new Tween(0, { duration: 480, easing: easeOutQuart });
	const tweenW = new Tween(0, { duration: 480, easing: easeOutQuart });

	$effect(() => {
		if (!activeBtn) return;
		if (!initialized) {
			tweenX.set(activeBtn.offsetLeft, { duration: 0 });
			tweenW.set(activeBtn.offsetWidth, { duration: 0 });
			initialized = true;
		} else {
			tweenX.target = activeBtn.offsetLeft;
			tweenW.target = activeBtn.offsetWidth;
		}
	});

	function scrollTo(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	$effect(() => {
		const sections = menu.categories
			.map((c) => document.getElementById(c.id))
			.filter((el): el is HTMLElement => el !== null);

		if (sections.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
				if (visible[0]) {
					activeId = visible[0].target.id;
				}
			},
			{
				rootMargin: '-30% 0px -55% 0px',
				threshold: [0, 0.25, 0.5, 0.75, 1]
			}
		);

		for (const s of sections) observer.observe(s);
		return () => observer.disconnect();
	});
</script>

<nav
	class="sticky top-0 z-10 -mx-4 border-b border-olive-200/70 bg-cream-50/80 px-4 backdrop-blur-md"
	aria-label="Категории меню"
>
	<div class="no-scrollbar relative flex gap-1 overflow-x-auto py-3">
		{#each menu.categories as cat (cat.id)}
			{@const isActive = activeId === cat.id}
			<button
				bind:this={buttons[cat.id]}
				type="button"
				onclick={() => scrollTo(cat.id)}
				class="relative z-10 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-300 ease-[var(--ease-out-expo)] {isActive
					? 'text-cream-50'
					: 'text-olive-600 hover:text-olive-900'}"
			>
				{cat.category}
			</button>
		{/each}
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-y-3 left-0 z-0 rounded-full bg-olive-700"
			style="transform: translateX({tweenX.current}px); width: {tweenW.current}px;"
		></div>
	</div>
</nav>
