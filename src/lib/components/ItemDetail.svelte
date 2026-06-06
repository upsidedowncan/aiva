<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { SvelteSet } from 'svelte/reactivity';
	import type { MenuData, MenuItem } from '$lib/menu';
	import { formatPrice, getAddons, getRecommendations, getCategoryForItem } from '$lib/menu';
	import type { Cart } from '$lib/cart.svelte';
	import { easeInOutSine, easeOutQuad } from '$lib/easing';
	import { lockScroll } from '$lib/scroll-lock';

	let {
		item = $bindable(),
		cart,
		menu,
		isAdmin = false,
		open = $bindable(false),
		onsaved
	}: {
		item: MenuItem | null;
		cart: Cart;
		menu: MenuData;
		isAdmin?: boolean;
		open: boolean;
		onsaved?: () => void | Promise<void>;
	} = $props();

	let qty = $state(1);
	const selectedAddons = new SvelteSet<string>();
	let editName = $state('');
	let editPrice = $state('');
	let editDescription = $state('');
	let editImage = $state('');
	let saving = $state(false);
	let saveError = $state<string | null>(null);

	let categoryId = $derived(item ? getCategoryForItem(menu, item.id) : null);
	let addons = $derived(categoryId ? getAddons(menu, categoryId) : []);
	let recommendations = $derived(item ? getRecommendations(menu, item.id, 4) : []);

	let addonsTotal = $derived(
		addons.filter((a) => selectedAddons.has(a.id)).reduce((s, a) => s + a.price, 0)
	);
	let basePrice = $derived(typeof item?.price === 'number' ? item.price : 0);
	let unitPrice = $derived(basePrice + addonsTotal);
	let totalPrice = $derived(unitPrice * qty);

	function close() {
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) close();
	}

	function toggleAddon(id: string) {
		if (selectedAddons.has(id)) selectedAddons.delete(id);
		else selectedAddons.add(id);
	}

	function inc() {
		qty = Math.min(qty + 1, 99);
	}
	function dec() {
		qty = Math.max(qty - 1, 1);
	}

	function addToCart() {
		if (!item) return;
		const chosen = addons.filter((a) => selectedAddons.has(a.id));
		cart.add(item, qty, chosen);
		open = false;
	}

	function startEdit() {
		if (!item) return;
		editName = item.name;
		editPrice = String(item.price);
		editDescription = item.description ?? '';
		editImage = item.image ?? '';
		saveError = null;
	}

	async function saveEdit() {
		if (!item || !categoryId) return;
		saving = true;
		saveError = null;
		try {
			const priceNum = Number(editPrice);
			const patch: Partial<MenuItem> = {
				name: editName.trim() || item.name,
				description: editDescription.trim() || undefined,
				image: editImage.trim() || undefined
			};
			if (editPrice.includes('/')) {
				patch.price = editPrice.trim();
			} else if (!Number.isNaN(priceNum) && editPrice.trim() !== '') {
				patch.price = priceNum;
			} else {
				patch.price = editPrice.trim();
			}
			const res = await fetch('/api/admin/items', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ categoryId, itemId: item.id, patch })
			});
			if (!res.ok) {
				const err = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(err.error ?? 'Ошибка сохранения');
			}
			if (item) {
				const updated = (await res.json()) as MenuItem;
				item.name = updated.name;
				item.price = updated.price;
				item.description = updated.description;
				item.image = updated.image;
			}
			await onsaved?.();
			open = false;
		} catch (e) {
			saveError = (e as Error).message;
		} finally {
			saving = false;
		}
	}

	async function deleteItem() {
		if (!item || !categoryId) return;
		if (!confirm(`Удалить «${item.name}»?`)) return;
		try {
			const res = await fetch('/api/admin/items', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ categoryId, itemId: item.id })
			});
			if (!res.ok) throw new Error('Не удалось удалить');
			open = false;
			await onsaved?.();
		} catch (e) {
			saveError = (e as Error).message;
		}
	}

	function addRecommendation(rec: MenuItem) {
		cart.add(rec, 1, []);
	}

	$effect(() => {
		if (!open) return;
		qty = 1;
		selectedAddons.clear();
		if (isAdmin) startEdit();
		return lockScroll();
	});
</script>

<svelte:window {onkeydown} />

{#if open && item}
	<button
		type="button"
		aria-label="Закрыть"
		onclick={close}
		transition:fade={{ duration: 300, easing: easeInOutSine }}
		class="fixed inset-0 z-40 cursor-default bg-olive-950/50 backdrop-blur-sm"
	></button>

	<div
		role="dialog"
		aria-modal="true"
		aria-label={item.name}
		class="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
	>
		<div
			transition:fly={{ y: 60, duration: 520, easing: easeInOutSine, opacity: 0 }}
			class="pointer-events-auto relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-cream-50 shadow-2xl shadow-olive-900/30 sm:max-h-[88vh] sm:rounded-3xl"
			style="padding-bottom: env(safe-area-inset-bottom);"
		>
			{#if item.image}
				<div class="relative h-40 shrink-0 overflow-hidden bg-olive-100 sm:h-52">
					<img
						src={isAdmin ? editImage || item.image : item.image}
						alt={item.name}
						class="detail-img h-full w-full object-cover"
						onload={(e) => e.currentTarget.classList.add('loaded')}
					/>
					<button
						type="button"
						onclick={close}
						aria-label="Закрыть"
						class="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream-50/90 text-olive-900 shadow-lg backdrop-blur transition-all duration-300 ease-[var(--ease-out-sine)] hover:scale-110 hover:bg-cream-50"
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
				</div>
			{/if}

			<div class="scroll-area flex-1 overflow-x-clip overflow-y-auto overscroll-contain px-6 py-5">
				{#if isAdmin}
					<div class="space-y-4">
						<div>
							<label
								for="edit-name"
								class="mb-1.5 block text-xs font-semibold tracking-widest text-olive-500 uppercase"
							>
								Название
							</label>
							<input
								id="edit-name"
								type="text"
								bind:value={editName}
								class="w-full rounded-xl border border-olive-200 bg-white px-3 py-2.5 text-base text-olive-900 transition-colors focus:border-olive-700 focus:outline-none"
							/>
						</div>
						<div>
							<label
								for="edit-price"
								class="mb-1.5 block text-xs font-semibold tracking-widest text-olive-500 uppercase"
							>
								Цена (₽ или «100/200»)
							</label>
							<input
								id="edit-price"
								type="text"
								bind:value={editPrice}
								class="w-full rounded-xl border border-olive-200 bg-white px-3 py-2.5 font-mono text-base text-olive-900 transition-colors focus:border-olive-700 focus:outline-none"
							/>
						</div>
						<div>
							<label
								for="edit-desc"
								class="mb-1.5 block text-xs font-semibold tracking-widest text-olive-500 uppercase"
							>
								Описание
							</label>
							<textarea
								id="edit-desc"
								bind:value={editDescription}
								rows="3"
								class="w-full resize-none rounded-xl border border-olive-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-olive-900 transition-colors focus:border-olive-700 focus:outline-none"
							></textarea>
						</div>
						<div>
							<label
								for="edit-image"
								class="mb-1.5 block text-xs font-semibold tracking-widest text-olive-500 uppercase"
							>
								URL изображения
							</label>
							<input
								id="edit-image"
								type="text"
								bind:value={editImage}
								placeholder="/images/foo.jpg"
								class="w-full rounded-xl border border-olive-200 bg-white px-3 py-2.5 font-mono text-sm text-olive-900 transition-colors focus:border-olive-700 focus:outline-none"
							/>
						</div>
						{#if saveError}
							<p class="rounded-lg bg-clay-500/10 px-3 py-2 text-sm text-clay-600">
								{saveError}
							</p>
						{/if}
					</div>
				{:else}
					<div class="mb-1 flex items-center gap-2">
						<span
							class="rounded-full bg-olive-100 px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-olive-600 uppercase"
						>
							{formatPrice(item.price)}
						</span>
					</div>
					<h2 class="text-2xl font-semibold tracking-tight text-olive-900">{item.name}</h2>
					{#if item.description}
						<p class="mt-2 text-sm leading-relaxed text-olive-500">{item.description}</p>
					{/if}

					{#if addons.length > 0}
						<div class="mt-6">
							<h3 class="mb-2 text-xs font-semibold tracking-widest text-olive-500 uppercase">
								Добавить к заказу
							</h3>
							<ul class="space-y-1.5">
								{#each addons as addon (addon.id)}
									{@const isSelected = selectedAddons.has(addon.id)}
									<li>
										<button
											type="button"
											onclick={() => toggleAddon(addon.id)}
											class="group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-300 ease-[var(--ease-out-sine)] {isSelected
												? 'border-olive-700 bg-olive-50'
												: 'border-olive-200 bg-white hover:border-olive-300 hover:bg-olive-50/50'}"
										>
											<span
												class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-300 ease-[var(--ease-out-back)] {isSelected
													? 'scale-110 border-olive-700 bg-olive-700'
													: 'border-olive-300 bg-white group-hover:border-olive-500'}"
											>
												{#if isSelected}
													<svg
														width="11"
														height="11"
														viewBox="0 0 11 11"
														fill="none"
														stroke="currentColor"
														stroke-width="2.5"
														stroke-linecap="round"
														stroke-linejoin="round"
														class="text-cream-50"
														in:scale={{ duration: 280, easing: quintOut, start: 0.4 }}
													>
														<path d="M1.5 5.5L4.5 8.5L9.5 2.5" />
													</svg>
												{/if}
											</span>
											<span class="flex-1 text-sm text-olive-900">{addon.name}</span>
											<span class="font-mono text-sm text-olive-500">+{addon.price} ₽</span>
										</button>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if recommendations.length > 0}
						<div class="mt-6">
							<h3 class="mb-3 text-xs font-semibold tracking-widest text-olive-500 uppercase">
								С этим заказывают
							</h3>
							<div
								class="no-scrollbar -mr-6 flex scroll-pl-0 gap-3 overflow-x-auto overscroll-x-contain pr-1 pb-2"
							>
								{#each recommendations as rec, i (rec.id)}
									{@const inCart = cart.getQty(rec.id) > 0}
									<div
										class="w-30 shrink-0 snap-start"
										in:fly|local={{
											y: 16,
											duration: 420,
											easing: easeOutQuad,
											delay: 200 + i * 60
										}}
									>
										<div
											class="relative aspect-square w-full overflow-hidden rounded-2xl bg-olive-100 ring-1 ring-olive-200/60 transition-all duration-300 ease-[var(--ease-out-sine)] {inCart
												? 'ring-2 ring-olive-600'
												: ''}"
										>
											{#if rec.image}
												<img
													src={rec.image}
													alt={rec.name}
													loading="lazy"
													class="rec-img h-full w-full object-cover"
													onload={(e) => e.currentTarget.classList.add('loaded')}
												/>
											{/if}
											<button
												type="button"
												onclick={() => addRecommendation(rec)}
												aria-label={inCart ? `Добавить ещё ${rec.name}` : `Добавить ${rec.name}`}
												class="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-[var(--ease-out-back)] hover:scale-110 active:scale-90 {inCart
													? 'bg-olive-600 text-cream-50 hover:bg-olive-700'
													: 'bg-olive-700 text-cream-50 hover:bg-olive-800'}"
											>
												{#if inCart}
													<svg
														width="14"
														height="14"
														viewBox="0 0 14 14"
														fill="none"
														stroke="currentColor"
														stroke-width="2.5"
														stroke-linecap="round"
														stroke-linejoin="round"
													>
														<path d="M2 7l3.5 3.5L12 4" />
													</svg>
												{:else}
													<svg
														width="14"
														height="14"
														viewBox="0 0 14 14"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
													>
														<path d="M7 2v10M2 7h10" />
													</svg>
												{/if}
											</button>
										</div>
										<div class="mt-2 px-1">
											<div class="truncate text-sm font-medium text-olive-900">{rec.name}</div>
											<div class="font-mono text-xs text-olive-500">{formatPrice(rec.price)}</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<div class="shrink-0 border-t border-olive-100 bg-cream-50 px-6 pt-3 pb-4">
				{#if isAdmin}
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={deleteItem}
							aria-label="Удалить"
							class="flex h-11 w-11 items-center justify-center rounded-full border border-clay-400/60 bg-white text-clay-500 transition-all duration-200 ease-[var(--ease-out-expo)] hover:scale-105 hover:bg-clay-500/10 active:scale-95"
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
								<path d="M2.5 4h9M5.5 4V2.5h3V4M4 4l.5 7.5h5L10 4" />
							</svg>
						</button>
						<button
							type="button"
							onclick={close}
							class="flex h-11 flex-1 items-center justify-center rounded-full border border-olive-200 bg-white text-sm font-medium text-olive-700 transition-all duration-200 ease-[var(--ease-out-expo)] hover:bg-olive-50 active:scale-[0.99]"
						>
							Отмена
						</button>
						<button
							type="button"
							onclick={saveEdit}
							disabled={saving}
							class="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-olive-700 text-sm font-medium text-cream-50 shadow-lg shadow-olive-700/25 transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-olive-800 active:translate-y-0 active:scale-[0.99] disabled:opacity-50"
						>
							{#if saving}
								<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="3"
										opacity="0.25"
									/>
									<path
										d="M22 12a10 10 0 0 0-10-10"
										stroke="currentColor"
										stroke-width="3"
										stroke-linecap="round"
									/>
								</svg>
							{/if}
							Сохранить
						</button>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<div
							class="flex items-center gap-1 rounded-full border border-olive-200 bg-white p-1 shadow-sm"
						>
							<button
								type="button"
								onclick={dec}
								disabled={qty <= 1}
								aria-label="Меньше"
								class="flex h-9 w-9 items-center justify-center rounded-full text-olive-700 transition-all duration-200 ease-[var(--ease-out-sine)] hover:bg-olive-100 active:scale-90 disabled:opacity-40"
							>
								−
							</button>
							{#key qty}
								<span
									class="w-8 text-center font-mono text-base font-semibold text-olive-900 tabular-nums"
									style="animation: pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1);"
								>
									{qty}
								</span>
							{/key}
							<button
								type="button"
								onclick={inc}
								aria-label="Больше"
								class="flex h-9 w-9 items-center justify-center rounded-full text-olive-700 transition-all duration-200 ease-[var(--ease-out-sine)] hover:bg-olive-100 active:scale-90"
							>
								+
							</button>
						</div>

						<button
							type="button"
							onclick={addToCart}
							class="flex flex-1 items-center justify-between rounded-full bg-olive-700 px-5 py-3 text-cream-50 shadow-lg shadow-olive-700/25 transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-olive-800 hover:shadow-xl hover:shadow-olive-700/35 active:translate-y-0 active:scale-[0.99]"
						>
							<span class="text-sm font-medium">В корзину</span>
							<span class="font-mono text-base font-semibold tabular-nums">{totalPrice} ₽</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.detail-img {
		opacity: 0;
		transform: scale(1.04);
		transition:
			opacity 700ms cubic-bezier(0.39, 0.575, 0.565, 1),
			transform 800ms cubic-bezier(0.39, 0.575, 0.565, 1);
	}
	.detail-img:global(.loaded) {
		opacity: 1;
		transform: scale(1);
	}
	.rec-img {
		opacity: 0;
		transition: opacity 600ms cubic-bezier(0.39, 0.575, 0.565, 1);
	}
	.rec-img:global(.loaded) {
		opacity: 1;
	}
</style>
