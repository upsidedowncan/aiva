<script lang="ts">
	import type { MenuCategory, MenuItem } from '$lib/menu';
	import { formatPrice } from '$lib/menu';
	import type { Cart } from '$lib/cart.svelte';
	import { fly } from 'svelte/transition';
	import { easeOutQuart } from '$lib/easing';

	let {
		category,
		cart,
		index = 0,
		isAdmin = false,
		onopen,
		onedit
	}: {
		category: MenuCategory;
		cart: Cart;
		index?: number;
		isAdmin?: boolean;
		onopen: (item: MenuItem) => void;
		onedit?: (item: MenuItem) => void;
	} = $props();
</script>

<section
	id={category.id}
	class="scroll-mt-28"
	in:fly={{ y: 24, duration: 600, easing: easeOutQuart, delay: 60 + index * 80 }}
>
	<header class="mb-4 flex items-baseline justify-between border-b border-olive-200 pb-2">
		<h2 class="text-2xl font-semibold tracking-tight text-olive-900">{category.category}</h2>
		<span class="font-mono text-sm text-olive-500">{category.items.length}</span>
	</header>

	<ul class="divide-y divide-olive-100">
		{#each category.items as item, i (item.id)}
			{@const qty = cart.getQty(item.id)}
			<li
				class="group flex items-center gap-4 py-4"
				in:fly={{ y: 12, duration: 420, easing: easeOutQuart, delay: 120 + index * 80 + i * 25 }}
			>
				{#if item.image}
					<button
						type="button"
						onclick={() => onopen(item)}
						aria-label="Открыть {item.name}"
						class="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-olive-100 ring-1 ring-olive-200/60 transition-all duration-300 ease-[var(--ease-out-quart)] hover:ring-olive-400/60"
					>
						<img
							src={item.image}
							alt={item.name}
							loading="lazy"
							decoding="async"
							onload={(e) => e.currentTarget.classList.add('loaded')}
							class="menu-img h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-110"
						/>
					</button>
				{/if}

				<button
					type="button"
					onclick={() => onopen(item)}
					class="min-w-0 flex-1 cursor-pointer text-left"
				>
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
						<h3
							class="text-base font-medium text-olive-900 transition-colors duration-200 group-hover:text-olive-700"
						>
							{item.name}
						</h3>
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-olive-50 to-cream-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-olive-700 ring-1 ring-olive-200/60"
						>
							<span class="h-1.5 w-1.5 rounded-full bg-olive-500"></span>
							{formatPrice(item.price)}
						</span>
					</div>
					{#if item.description}
						<p class="mt-1 text-sm leading-relaxed text-olive-500/90">{item.description}</p>
					{/if}
				</button>

				<div class="flex shrink-0 items-center gap-2">
					{#if isAdmin}
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								onedit?.(item);
							}}
							aria-label="Редактировать {item.name}"
							class="flex h-9 w-9 items-center justify-center rounded-full border border-olive-300 bg-white text-olive-700 transition-all duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-olive-700 hover:bg-olive-700 hover:text-cream-50 hover:shadow-md active:translate-y-0 active:scale-95"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 14 14"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M9.5 2.5l2 2-7 7-2.5.5.5-2.5 7-7z" />
							</svg>
						</button>
					{:else if qty === 0}
						<button
							type="button"
							onclick={() => onopen(item)}
							class="rounded-full border border-olive-700 bg-olive-700 px-4 py-1.5 text-sm font-medium text-cream-50 transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-olive-800 hover:shadow-md hover:shadow-olive-700/20 active:translate-y-0 active:scale-95"
						>
							В корзину
						</button>
					{:else}
						<div
							class="flex items-center gap-1 rounded-full border border-olive-200 bg-white p-1 shadow-sm"
							in:fly={{ y: -4, duration: 280, easing: easeOutQuart }}
						>
							<button
								type="button"
								onclick={() => cart.remove(item.id)}
								aria-label="Убрать"
								class="flex h-7 w-7 items-center justify-center rounded-full text-olive-700 transition-all duration-200 ease-[var(--ease-out-expo)] hover:bg-olive-100 active:scale-90"
							>
								−
							</button>
							<span class="w-6 text-center font-mono text-sm text-olive-900 tabular-nums"
								>{qty}</span
							>
							<button
								type="button"
								onclick={() => onopen(item)}
								aria-label="Добавить ещё"
								class="flex h-7 w-7 items-center justify-center rounded-full bg-olive-700 text-white transition-all duration-200 ease-[var(--ease-out-expo)] hover:bg-olive-800 active:scale-90"
							>
								+
							</button>
						</div>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</section>

<style>
	.menu-img {
		opacity: 0;
		transform: scale(1.02);
		transition:
			opacity 600ms cubic-bezier(0.16, 1, 0.3, 1),
			transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.menu-img:global(.loaded) {
		opacity: 1;
		transform: scale(1);
	}
</style>
