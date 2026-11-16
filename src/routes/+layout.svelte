<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/theme/tokens.css';
	import Sidebar from '$lib/layout/Sidebar.svelte';
	import Header from '$lib/layout/Header.svelte';
	import MobileBottomNav from '$lib/layout/MobileBottomNav.svelte';
	import ShortcutsModal from '$lib/components/ShortcutsModal.svelte';
	import CreateCustomerHeadModal from '$lib/components/CreateCustomerHeadModal.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { initBahrainTimezoneDefaults } from '$lib/formatters/timezone-defaults';
	import { handleGlobalShortcut } from '$lib/services/shortcuts';

	let { children } = $props();

	onMount(() => {
		initBahrainTimezoneDefaults();

		// Global keyboard shortcuts handler (F1-F10, ?, Esc)
		const handleKeyDown = (e: KeyboardEvent) => {
			if ($page.url.pathname.startsWith('/login')) return;
			handleGlobalShortcut(e, (route) => {
				goto(route);
			});
		};

		window.addEventListener('keydown', handleKeyDown);

		// Prevent mouse wheel scrolling from inadvertently changing number input values
		const handleWheel = (e: WheelEvent) => {
			const active = document.activeElement;
			if (active instanceof HTMLInputElement && active.type === 'number') {
				active.blur();
			}
			if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
				e.target.blur();
			}
		};

		window.addEventListener('wheel', handleWheel, { passive: true });

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('wheel', handleWheel);
		};
	});

	// Skip the app shell (sidebar + header) on the standalone login page
	const isAuthPage = $derived($page.url.pathname.startsWith('/login'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Texas travels - Sales Portal</title>
</svelte:head>

{#if isAuthPage}
	<!-- Standalone layout: no sidebar, no header — full-screen -->
	<div class="theme-sales min-h-[100dvh] bg-background text-foreground antialiased">
		{@render children()}
	</div>
{:else}
	<!-- Authenticated app shell -->
	<div class="theme-sales min-h-[100dvh] h-[100dvh] bg-background text-foreground antialiased flex flex-row overflow-hidden">
		<div class="hidden lg:block h-[100dvh] sticky top-0">
			<Sidebar />
		</div>
		<div class="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
			<Header />
			<main class="flex-1 overflow-y-auto px-6 pt-6 pb-24 lg:pb-6 bg-muted/20">
				{@render children()}
			</main>
		</div>
	</div>
	<MobileBottomNav />
	<ShortcutsModal />
	<CreateCustomerHeadModal />
{/if}
