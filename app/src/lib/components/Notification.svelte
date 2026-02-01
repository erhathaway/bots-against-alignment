<script lang="ts">
	import { notificationState } from '$lib/state/store.svelte';
	import type { Notification } from '$lib/types';
	import { slide } from 'svelte/transition';
	import BarAnimator from '$lib/components/BarAnimator.svelte';

	let visibleToasts = $state<Notification[]>([]);
	let lastNotificationIndexSeen = $state(0);

	$effect(() => {
		const newNotifications = notificationState.slice(lastNotificationIndexSeen);
		if (newNotifications.length === 0) return;

		visibleToasts = [
			...visibleToasts,
			...newNotifications.filter(
				(notification) => !visibleToasts.some((toast) => toast.uuid === notification.uuid)
			)
		];
		lastNotificationIndexSeen = notificationState.length;
	});

	const closeToast = (toast: Notification) => {
		visibleToasts = visibleToasts.filter((toastItem) => toastItem.uuid !== toast.uuid);
	};

	function onTransitionEnd(event: TransitionEvent, toast: Notification) {
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
			ontransitionend={(event) => onTransitionEnd(event, toast)}
		>
			<div class="top">
				<h1>{toast.title}</h1>

				<small>{toast.kind}</small>
			</div>
			<div class="middle">
				<h2>{toast.body}</h2>

				<button type="button" class="close-button" onclick={() => closeToast(toast)}>X</button>
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
		background: none;
		border: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		font-weight: bold;
		margin: 1rem;
	}
</style>
