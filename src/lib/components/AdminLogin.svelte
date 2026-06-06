<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { easeInOutSine } from '$lib/easing';
	import { lockScroll } from '$lib/scroll-lock';

	let { open = $bindable(false), onsuccess }: { open: boolean; onsuccess: () => void } = $props();

	let password = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let inputEl: HTMLInputElement | null = $state(null);

	$effect(() => {
		if (!open) return;
		password = '';
		error = null;
		setTimeout(() => inputEl?.focus(), 100);
		return lockScroll();
	});

	function close() {
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) close();
	}

	async function submit(e: Event) {
		e.preventDefault();
		if (!password || submitting) return;
		submitting = true;
		error = null;
		try {
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});
			if (!res.ok) {
				const err = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(err.error ?? 'Ошибка');
			}
			onsuccess();
			open = false;
		} catch (e) {
			error = (e as Error).message;
			password = '';
			inputEl?.focus();
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<button
		type="button"
		aria-label="Закрыть"
		onclick={close}
		transition:fade={{ duration: 240, easing: easeInOutSine }}
		class="fixed inset-0 z-40 cursor-default bg-olive-950/50 backdrop-blur-sm"
	></button>

	<div
		role="dialog"
		aria-modal="true"
		aria-label="Вход в админ-панель"
		class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
	>
		<form
			transition:fly={{ y: 24, duration: 380, easing: easeInOutSine, opacity: 0 }}
			onsubmit={submit}
			class="pointer-events-auto w-full max-w-sm rounded-3xl bg-cream-50 p-7 shadow-2xl shadow-olive-900/30"
		>
			<div class="mb-1 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-olive-700 text-lg">
					🔒
				</div>
				<div>
					<h2 class="text-lg font-semibold text-olive-900">Админ-панель</h2>
					<p class="text-xs text-olive-500">Введите пароль для редактирования меню</p>
				</div>
			</div>

			<div class="mt-5">
				<label for="admin-password" class="sr-only">Пароль</label>
				<input
					bind:this={inputEl}
					bind:value={password}
					id="admin-password"
					type="password"
					placeholder="Пароль"
					autocomplete="current-password"
					disabled={submitting}
					class="w-full rounded-xl border border-olive-200 bg-white px-4 py-3 font-mono text-base text-olive-900 transition-colors focus:border-olive-700 focus:outline-none disabled:opacity-50"
				/>
			</div>

			{#if error}
				<p
					class="mt-3 rounded-lg bg-clay-500/10 px-3 py-2 text-sm text-clay-600"
					transition:fly={{ y: -4, duration: 220, easing: easeInOutSine }}
				>
					{error}
				</p>
			{/if}

			<div class="mt-5 flex gap-2">
				<button
					type="button"
					onclick={close}
					disabled={submitting}
					class="flex h-11 flex-1 items-center justify-center rounded-full border border-olive-200 bg-white text-sm font-medium text-olive-700 transition-all duration-200 ease-[var(--ease-out-expo)] hover:bg-olive-50 active:scale-[0.99] disabled:opacity-50"
				>
					Отмена
				</button>
				<button
					type="submit"
					disabled={!password || submitting}
					class="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-olive-700 text-sm font-medium text-cream-50 shadow-lg shadow-olive-700/25 transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-olive-800 active:translate-y-0 active:scale-[0.99] disabled:opacity-50"
				>
					{#if submitting}
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
					Войти
				</button>
			</div>
		</form>
	</div>
{/if}
