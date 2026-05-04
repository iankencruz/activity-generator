<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';

	let { data } = $props();

	// State for the list and the new post input
	let activities = $state(data.initialActivity || []);
	let newTitle = $state('');
	let isSubmitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!newTitle.trim() || isSubmitting) return;

		isSubmitting = true;
		try {
			const body = {
				title: newTitle
			};

			// This makes the POST request to /api/collections/Activity/records
			await pb.collection('Activity').create(body);

			// Reset form
			newTitle = '';
		} catch (err) {
			console.error('Failed to create record:', err);
		} finally {
			isSubmitting = false;
		}
	}

	onMount(() => {
		pb.collection('Activity').subscribe('*', ({ action, record }) => {
			if (action === 'create') {
				// Svelte 5 will detect this assignment and update the DOM
				activities = [record, ...activities];
			}
		});

		return () => pb.collection('Activity').unsubscribe('Activity');
	});
</script>

<h1>Activity Feed</h1>

<!-- Quick Post Form -->
<form onsubmit={handleSubmit} style="margin-bottom: 2rem;">
	<input
		type="text"
		bind:value={newTitle}
		placeholder="What's happening?"
		disabled={isSubmitting}
	/>
	<button type="submit" disabled={isSubmitting || !newTitle.trim()}>
		{isSubmitting ? 'Posting...' : 'Post'}
	</button>
</form>

<hr />

<ul>
	{#each activities as item (item.id)}
		<li>
			<strong>{item.title}</strong><br />
			<small>{item.id}</small>
		</li>
	{:else}
		<li>No activities found.</li>
	{/each}
</ul>
