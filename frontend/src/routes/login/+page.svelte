<script lang="ts">
	import { pb } from '$lib/pocketbase';

	let isLoggingIn = $state(false);

	async function loginWithGoogle() {
		isLoggingIn = true;
		try {
			// This opens a popup window, handles the callback,
			// and saves the auth token to localStorage automatically.
			const authData = await pb.collection('users').authWithOAuth2({
				provider: 'google'
			});

			console.log('Logged in as:', pb.authStore.model);
			// Redirect or update UI state here
			window.location.href = '/';
		} catch (err) {
			console.error('OAuth failed:', err);
		} finally {
			isLoggingIn = false;
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
	<button
		onclick={loginWithGoogle}
		disabled={isLoggingIn}
		class="rounded-xl bg-white px-8 py-3 font-bold text-black transition-all hover:bg-zinc-200 disabled:opacity-50"
	>
		{isLoggingIn ? 'Connecting...' : 'Login with Google'}
	</button>
</div>
