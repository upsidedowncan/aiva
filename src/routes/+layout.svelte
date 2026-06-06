<script lang="ts">
	import './layout.css';
	import 'geist-svelte/font/sans';
	import 'geist-svelte/font/mono';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Айва — Кафе в Буйнакске</title>
	<meta
		name="description"
		content="Онлайн-заказ еды в кафе «Айва», Буйнакск. Бургеры, шаурма, шашлык и снэки."
	/>
</svelte:head>
{@render children()}
