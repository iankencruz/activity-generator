<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';

	let { data } = $props();

	// --- Global State ---
	let activities = $state(data.initialActivity || []);
	let isSpinning = $state(false);

	// Randomize starting position on load
	let currentRelativeIndex = $state(
		activities.length > 0 ? Math.floor(Math.random() * activities.length) : 0
	);
	let offset = $state(currentRelativeIndex * 50);

	// --- UI State ---
	let showDrawer = $state(false);
	let newTitle = $state('');
	let isSubmitting = $state(false);
	let showPopup = $state(false);
	let selectedActivity = $state<any>(null);

	// --- Actions ---

	async function addActivity(e: Event) {
		e.preventDefault();
		if (!newTitle.trim() || isSubmitting) return;
		isSubmitting = true;
		try {
			await pb.collection('Activity').create({ title: newTitle });
			newTitle = '';
		} catch (err) {
			console.error('Creation failed:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function spin() {
		if (activities.length === 0 || isSpinning) return;
		isSpinning = true;
		showPopup = false;

		const winnerIndex = Math.floor(Math.random() * activities.length);

		// Logic to always move forward from the current position
		const rotationCount = activities.length * 5;
		const distanceToWinner =
			(winnerIndex - currentRelativeIndex + activities.length) % activities.length;
		const totalStepsToMove = rotationCount + distanceToWinner;

		// Increment the cumulative offset (50px per item)
		offset += totalStepsToMove * 50;
		currentRelativeIndex = winnerIndex;

		setTimeout(() => {
			isSpinning = false;
			selectedActivity = activities[winnerIndex];
			showPopup = true;
		}, 2000);
	}

	async function handleConfirm() {
		if (!selectedActivity) return;
		try {
			const body = {
				title: selectedActivity.title,
				created_by: 'system',
				amount_chosen: (selectedActivity.amount_chosen || 0) + 1
			};

			const updatedRecord = await pb.collection('Activity').update(selectedActivity.id, body);

			activities = activities.map((a: any) => (a.id === updatedRecord.id ? updatedRecord : a));
			closePopup();
		} catch (err) {
			console.error('Update failed:', err);
		}
	}

	function closePopup() {
		showPopup = false;
		selectedActivity = null;
	}

	onMount(() => {
		const unsubscribe = pb.collection('Activity').subscribe('*', ({ action, record }) => {
			if (action === 'create') activities = [record, ...activities];
			if (action === 'update')
				activities = activities.map((a) => (a.id === record.id ? record : a));
			if (action === 'delete') activities = activities.filter((a) => a.id !== record.id);
		});
		return () => unsubscribe.then((u) => u());
	});
</script>

<main class="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center p-8">
	<!-- Top Actions -->
	<div class="mb-4 flex w-full max-w-md justify-end">
		<button
			onclick={() => (showDrawer = true)}
			class="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-700"
		>
			+ Manage Activities
		</button>
	</div>

	<!-- Slot Machine -->
	<section class="slot-machine-container w-full max-w-md">
		<h2 class="mb-4 text-2xl font-bold tracking-tight text-white uppercase italic">
			Activity Slot
		</h2>

		<div
			class="window relative h-[150px] w-full overflow-hidden rounded-md border-4 border-zinc-800 bg-white text-black shadow-inner"
		>
			<!-- pt-[50px] centers the item in the middle slot -->
			<div
				class="reel flex flex-col pt-[50px]"
				style="transform: translateY(-{offset}px); transition: {isSpinning
					? 'transform 2s cubic-bezier(0.18, 0.89, 0.32, 1.15)'
					: 'none'}"
			>
				{#each Array(100) as _}
					{#each activities as item}
						<div class="h-[50px] truncate px-4 text-center leading-[50px] font-bold">
							{item.title}
						</div>
					{/each}
				{/each}
			</div>

			<!-- Fade Overlays for Depth -->
			<div
				class="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-white via-transparent to-white opacity-95"
			></div>
			<!-- Center Selection Indicator -->
			<div
				class="pointer-events-none absolute top-[50px] left-0 z-0 h-[50px] w-full border-y border-red-500/20 bg-red-500/5"
			></div>
		</div>

		<button
			onclick={spin}
			disabled={isSpinning || activities.length === 0}
			class="mt-6 w-full rounded-full bg-red-600 py-4 font-black tracking-widest text-white uppercase shadow-lg transition-all hover:bg-red-700 active:scale-95 disabled:bg-gray-600"
		>
			{isSpinning ? 'Spinning...' : 'Pull Lever'}
		</button>
	</section>

	<!-- Side Drawer -->
	{#if showDrawer}
		<div
			onclick={() => (showDrawer = false)}
			class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
		></div>
		<aside
			class="animate-in slide-in-from-right fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-zinc-900 p-6 text-white shadow-2xl duration-300"
		>
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-xl font-bold">Activities</h3>
				<button onclick={() => (showDrawer = false)} class="text-zinc-400 hover:text-white"
					>✕</button
				>
			</div>

			<form onsubmit={addActivity} class="mb-6 flex gap-2">
				<input
					bind:value={newTitle}
					placeholder="New activity..."
					class="flex-1 rounded-lg border-none bg-zinc-800 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
				/>
				<button type="submit" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold">Add</button>
			</form>

			<div class="flex-1 space-y-2 overflow-y-auto">
				{#each activities as item (item.id)}
					<div class="flex items-center justify-between rounded-lg bg-zinc-800 p-3">
						<span class="text-sm">{item.title}</span>
						<span class="text-[10px] text-zinc-500">{item.amount_chosen || 0}x</span>
					</div>
				{/each}
			</div>
		</aside>
	{/if}

	<!-- Result Popup -->
	{#if showPopup && selectedActivity}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
		>
			<div class="w-full max-w-sm rounded-2xl bg-white p-8 text-center text-black shadow-2xl">
				<p class="mb-2 text-xs font-bold text-gray-500 uppercase">The Result:</p>
				<h3 class="mb-6 text-3xl leading-tight font-black">{selectedActivity.title}</h3>

				<div class="flex flex-col gap-3">
					<button
						onclick={handleConfirm}
						class="w-full rounded-lg bg-green-600 py-3 font-bold text-white">Confirm</button
					>
					<button
						onclick={closePopup}
						class="w-full rounded-lg bg-gray-100 py-3 font-bold text-gray-800">Try Again</button
					>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	.slot-machine-container {
		text-align: center;
		padding: 2.5rem;
		background: #111;
		border: 8px solid #222;
		border-radius: 2rem;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
	}
</style>
