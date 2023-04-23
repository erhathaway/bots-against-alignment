<script lang="ts">
	import { notificationStore } from '$lib/store';
	import type { Notification } from '$lib/store';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import BarAnimator from './BarAnimator.svelte';

	let toasts: Notification[] = [];
	let visibleToasts: Notification[] = [];
	let lastNotificationIndexSeen = 0;

	// onMount(() => {
	// 	visibleToasts = [...toasts].slice(-3, toasts.length);
	// });

	$: {
		const newlastNotificationIndexSeen = $notificationStore.length;
		// console.log('$notificationStore', $notificationStore);
		const _toasts = $notificationStore.slice(
			lastNotificationIndexSeen,
			newlastNotificationIndexSeen
		);
		toasts = [...new Set([...toasts, ..._toasts])];
		// toasts = [...toasts, ..._toasts];
		// filter duplicates
		// visibleToasts = [...visibleToasts, ..._toasts];
		visibleToasts = [...new Set([...visibleToasts, ..._toasts])];
		lastNotificationIndexSeen = newlastNotificationIndexSeen;
	}

	const closeToast = (toast: Notification) => {
		console.log('closeToast - start', toast, visibleToasts.length);

		visibleToasts = visibleToasts.filter((t) => t.uuid !== toast.uuid);
		console.log('closeToast - done', visibleToasts.length);
	};

	function onTransitionEnd(event, toast: Notification) {
		if (event.propertyName === 'opacity') {
			closeToast(toast);
		}
	}

</script>

<div class="toast-container">
	{#each visibleToasts as toast (toast.uuid)}
		<div
			class="toast"
			style="opacity: 1"
            transition:slide|local
			on:transitionend={(event) => onTransitionEnd(event, toast)}
		>
			<!-- <div> -->
			<div class="top">
				<h1>{toast.title}</h1>

				<small>{toast.kind}</small>
			</div>
			<div class="middle">
				<h2>{toast.body}</h2>

				<span class="close-button" on:click={() => closeToast(toast)}>X</span>
			</div>
            <BarAnimator duration={5} onFinish={() => closeToast(toast)} />
		</div>
	{/each}
</div>

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
	}

	.middle {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
	}
	h1 {
		margin: 0;
		font-size: 1.2rem;
		color: yellow;
	}
	h2 {
		margin: 0;
		padding: 1rem 0;
		font-size: 0.8rem;
	}

	small {
		text-shadow: 0px 0px 0px #3e3d3d, -1px -1px 0px rgb(53, 53, 53);
		color: rgba(29, 29, 29, 0.884);
		font-weight: bold;
		letter-spacing: 0.3rem;
	}
	.toast-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 100;
	}

	.toast {
		background-color: rgb(0, 0, 0);
		color: white;
		border-radius: 5px;
		padding: 1rem;
		margin-bottom: 1rem;
		width: 300px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		opacity: 1;
		transition: opacity 0.5s ease;
        box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);

	}

	.close-button {
		cursor: pointer;
		font-weight: bold;
		margin: 1rem;
	}


</style>
