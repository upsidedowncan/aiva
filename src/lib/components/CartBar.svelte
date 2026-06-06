<script lang="ts">
	import type { Cart } from '$lib/cart.svelte';
	import { fly } from 'svelte/transition';
	import { easeOutBack } from '$lib/easing';

	let {
		cart,
		onopen,
		hidden = false
	}: { cart: Cart; onopen: () => void; hidden?: boolean } = $props();
</script>

{#if cart.count > 0 && !hidden}
	<div
		class="fixed inset-x-0 bottom-0 z-20 px-4 pb-4"
		style="padding-bottom: max(1rem, env(safe-area-inset-bottom));"
		in:fly={{ y: 80, duration: 480, easing: easeOutBack, delay: 80 }}
		out:fly={{ y: 80, duration: 240, easing: easeOutBack }}
	>
		<button
			type="button"
			onclick={onopen}
			class="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-full bg-olive-700 px-5 py-3 text-cream-50 shadow-xl shadow-olive-700/25 transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-olive-800 hover:shadow-2xl hover:shadow-olive-700/35 active:translate-y-0 active:scale-[0.99]"
		>
			<div class="flex items-center gap-3">
				<span
					class="relative flex h-8 w-8 items-center justify-center rounded-full bg-cream-50 font-mono text-sm font-semibold text-olive-800 tabular-nums"
				>
					{#key cart.count}
						<span
							class="absolute inset-0 flex items-center justify-center"
							style="animation: pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1);"
						>
							{cart.count}
						</span>
					{/key}
				</span>
				<span class="text-sm font-medium">Корзина</span>
			</div>
			<div class="flex items-center gap-3">
				<span class="font-mono text-base font-semibold tabular-nums">{cart.total} ₽</span>
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M3 7h8M7 3l4 4-4 4" />
				</svg>
			</div>
		</button>
	</div>
{/if}
