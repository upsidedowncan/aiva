<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import type { Cart } from '$lib/cart.svelte';
	import { easeOutQuart, easeInOutQuart } from '$lib/easing';
	import { lockScroll } from '$lib/scroll-lock';

	let { cart, open = $bindable(false) }: { cart: Cart; open: boolean } = $props();

	function close() {
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) close();
	}

	function checkout() {
		if (cart.lines.length === 0) return;
		const lines = cart.lines
			.map((l) => {
				const addons = l.addons.length > 0 ? ` (${l.addons.map((a) => a.name).join(', ')})` : '';
				return `• ${l.item.name}${addons} × ${l.qty} = ${cart.lineTotal(l)} ₽`;
			})
			.join('\n');
		const message = `Здравствуйте! Хочу оформить заказ из кафе «Айва»:\n\n${lines}\n\nИтого: ${cart.total} ₽`;
		const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
		window.open(url, '_blank');
	}

	$effect(() => {
		if (!open) return;
		return lockScroll();
	});
</script>

<svelte:window {onkeydown} />

{#if open}
	<!-- Backdrop -->
	<button
		type="button"
		aria-label="Закрыть корзину"
		onclick={close}
		transition:fade={{ duration: 280, easing: easeOutQuart }}
		class="fixed inset-0 z-30 cursor-default bg-olive-950/40 backdrop-blur-sm"
	></button>

	<!-- Sheet -->
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Корзина"
		transition:fly={{ y: '100%', duration: 480, easing: easeInOutQuart, opacity: 0 }}
		class="fixed inset-x-0 bottom-0 z-40 flex max-h-[92vh] flex-col rounded-t-3xl bg-cream-50 shadow-[0_-24px_60px_-12px_rgba(31,29,14,0.35)]"
		style="padding-bottom: env(safe-area-inset-bottom);"
	>
		<!-- Drag handle -->
		<div class="flex justify-center pt-3 pb-2">
			<span class="h-1.5 w-12 rounded-full bg-olive-200"></span>
		</div>

		<!-- Header -->
		<header class="flex items-center justify-between px-6 pb-4">
			<div>
				<h2 class="text-xl font-semibold tracking-tight text-olive-900">Корзина</h2>
				<p class="font-mono text-xs text-olive-500">
					{cart.count}
					{cart.count === 1 ? 'позиция' : cart.count < 5 && cart.count > 0 ? 'позиции' : 'позиций'}
				</p>
			</div>
			<button
				type="button"
				onclick={close}
				aria-label="Закрыть"
				class="flex h-9 w-9 items-center justify-center rounded-full bg-olive-100 text-olive-700 transition-all duration-300 ease-[var(--ease-out-expo)] hover:scale-110 hover:bg-olive-200"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<path d="M1 1l12 12M13 1L1 13" />
				</svg>
			</button>
		</header>

		<!-- Items -->
		<div class="flex-1 overflow-y-auto overscroll-contain px-6">
			{#if cart.lines.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="mb-3 text-4xl">🫒</div>
					<p class="text-sm text-olive-500">Корзина пуста. Добавьте что-нибудь из меню.</p>
				</div>
			{:else}
				<ul class="divide-y divide-olive-100">
					{#each cart.lines as line (line.id)}
						<li class="flex items-center gap-3 py-4">
							{#if line.item.image}
								<div
									class="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-olive-100 ring-1 ring-olive-200/60"
								>
									<img
										src={line.item.image}
										alt={line.item.name}
										loading="lazy"
										decoding="async"
										onload={(e) => e.currentTarget.classList.add('loaded')}
										class="cart-img h-full w-full object-cover"
									/>
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<div class="truncate text-sm font-medium text-olive-900">{line.item.name}</div>
								{#if line.addons.length > 0}
									<div class="truncate text-xs text-olive-500">
										+ {line.addons.map((a) => a.name).join(', ')}
									</div>
								{/if}
								<div class="font-mono text-xs text-olive-500">
									{typeof line.item.price === 'number' ? line.item.price : line.item.price} ₽
								</div>
							</div>

							<div
								class="flex items-center gap-1 rounded-full border border-olive-200 bg-white p-0.5"
							>
								<button
									type="button"
									onclick={() => cart.decLine(line.id)}
									aria-label="Убрать"
									class="flex h-7 w-7 items-center justify-center rounded-full text-olive-700 transition-all duration-200 ease-[var(--ease-out-expo)] hover:bg-olive-100"
								>
									−
								</button>
								{#key line.qty}
									<span
										class="w-7 text-center font-mono text-sm tabular-nums"
										style="animation: pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1);"
									>
										{line.qty}
									</span>
								{/key}
								<button
									type="button"
									onclick={() => cart.incLine(line.id)}
									aria-label="Добавить"
									class="flex h-7 w-7 items-center justify-center rounded-full bg-olive-700 text-white transition-all duration-200 ease-[var(--ease-out-expo)] hover:bg-olive-800"
								>
									+
								</button>
							</div>

							<div class="w-20 text-right font-mono text-sm text-olive-900 tabular-nums">
								{cart.lineTotal(line)} ₽
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Footer -->
		<footer class="border-t border-olive-100 bg-cream-50 px-6 pt-4 pb-6">
			<div class="mb-4 flex items-baseline justify-between">
				<span class="text-sm text-olive-600">Итого</span>
				<span class="font-mono text-2xl font-semibold text-olive-900 tabular-nums"
					>{cart.total} ₽</span
				>
			</div>
			<button
				type="button"
				disabled={cart.lines.length === 0}
				onclick={checkout}
				class="w-full rounded-full bg-olive-700 px-6 py-3.5 text-sm font-medium text-cream-50 shadow-lg shadow-olive-700/20 transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-olive-800 hover:shadow-xl hover:shadow-olive-700/30 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-olive-200 disabled:text-olive-500 disabled:shadow-none"
			>
				Оформить заказ
			</button>
			{#if cart.lines.length > 0}
				<button
					type="button"
					onclick={() => cart.clear()}
					class="mt-3 block w-full text-center text-xs text-olive-500 transition-colors hover:text-olive-700"
				>
					Очистить корзину
				</button>
			{/if}
		</footer>
	</div>
{/if}

<style>
	.cart-img {
		opacity: 0;
		transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.cart-img:global(.loaded) {
		opacity: 1;
	}
</style>
