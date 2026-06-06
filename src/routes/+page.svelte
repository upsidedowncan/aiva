<script lang="ts">
	import type { PageData } from './$types';
	import type { MenuData, MenuItem } from '$lib/menu';
	import { Cart } from '$lib/cart.svelte';
	import MenuCategory from '$lib/components/MenuCategory.svelte';
	import CategoryNav from '$lib/components/CategoryNav.svelte';
	import CartBar from '$lib/components/CartBar.svelte';
	import CartSheet from '$lib/components/CartSheet.svelte';
	import ItemDetail from '$lib/components/ItemDetail.svelte';
	import AdminLogin from '$lib/components/AdminLogin.svelte';
	import AdminDashboard from '$lib/components/AdminDashboard.svelte';
	import { fly } from 'svelte/transition';
	import { easeOutQuart } from '$lib/easing';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// eslint-disable-next-line svelte/prefer-writable-derived
	let menu = $state<MenuData>(structuredClone(data.menu));

	$effect(() => {
		menu = structuredClone(data.menu);
	});

	$effect(() => {
		const send = () => fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
		send();
		const t = setInterval(send, 30_000);
		return () => clearInterval(t);
	});

	const cart = new Cart();
	let sheetOpen = $state(false);
	let detailItem = $state<MenuItem | null>(null);
	let detailOpen = $state(false);
	let loginOpen = $state(false);
	let isAdmin = $state(data.isAdmin);
	let overlayOpen = $derived(sheetOpen || detailOpen || loginOpen);

	function openSheet() {
		sheetOpen = true;
	}

	function openDetail(item: MenuItem) {
		detailItem = item;
		detailOpen = true;
	}

	function openEdit(item: MenuItem) {
		detailItem = item;
		detailOpen = true;
	}

	async function logout() {
		await fetch('/api/admin/logout', { method: 'POST' });
		isAdmin = false;
		await invalidateAll();
	}

	async function onItemSaved() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Айва — Онлайн-заказ · Буйнакск</title>
</svelte:head>

<main class="mx-auto min-h-screen max-w-3xl px-4 pt-6 pb-32">
	<div
		class="mb-6 flex items-center justify-between"
		in:fly={{ y: -8, duration: 600, easing: easeOutQuart }}
	>
		<button
			type="button"
			onclick={() => (isAdmin ? null : (loginOpen = true))}
			aria-label="Айва"
			class="-ml-2 flex items-center gap-3 rounded-2xl p-2 text-left transition-colors duration-200 ease-[var(--ease-out-sine)] hover:bg-olive-100/60 active:scale-[0.98]"
		>
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-olive-700 text-2xl">
				🫒
			</div>
			<div>
				<h1 class="text-3xl font-semibold tracking-tight text-olive-900">Айва</h1>
				<p class="text-sm text-olive-500">Кафе · Буйнакск · Онлайн-заказ</p>
			</div>
		</button>

		{#if isAdmin}
			<button
				type="button"
				onclick={logout}
				class="flex items-center gap-1.5 rounded-full border border-olive-300 bg-olive-50 px-3 py-1.5 text-xs font-medium text-olive-700 transition-all duration-200 ease-[var(--ease-out-sine)] hover:border-olive-700 hover:bg-olive-700 hover:text-cream-50"
			>
				<svg
					width="12"
					height="12"
					viewBox="0 0 14 14"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
				>
					<path
						d="M5 3V2a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1M9 7H2m0 0l2-2m-2 2l2 2"
					/>
				</svg>
				Выйти
			</button>
		{/if}
	</div>

	{#if isAdmin}
		<div
			class="mb-4 flex items-center gap-2 rounded-2xl border border-olive-300 bg-olive-50 px-4 py-2.5 text-sm text-olive-700"
			in:fly={{ y: -4, duration: 360, easing: easeOutQuart }}
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M9.5 2.5l4 4-8 8-4 1 1-4 7-7z" />
			</svg>
			<span>Режим редактирования · изменения сохраняются на сервере</span>
		</div>

		<div class="mb-6">
			<AdminDashboard />
		</div>
	{/if}

	<CategoryNav {menu} />

	<div class="mt-6 space-y-10">
		{#each menu.categories as cat, i (cat.id)}
			<MenuCategory
				category={cat}
				{cart}
				index={i}
				{isAdmin}
				onopen={openDetail}
				onedit={openEdit}
			/>
		{/each}
	</div>

	<footer class="mt-16 border-t border-olive-200 pt-6 text-center">
		<p class="font-mono text-xs text-olive-500">© Айва · Буйнакск</p>
	</footer>
</main>

<CartBar {cart} onopen={openSheet} hidden={overlayOpen} />
<CartSheet {cart} bind:open={sheetOpen} />
<ItemDetail
	{cart}
	{menu}
	{isAdmin}
	bind:item={detailItem}
	bind:open={detailOpen}
	onsaved={onItemSaved}
/>
<AdminLogin
	bind:open={loginOpen}
	onsuccess={async () => {
		isAdmin = true;
		await invalidateAll();
	}}
/>

<style>
	:global(.no-scrollbar) {
		scrollbar-width: none;
	}
	:global(.no-scrollbar::-webkit-scrollbar) {
		display: none;
	}
</style>
