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
	.toast-container {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 9999;
	}

	.toast {
		background: var(--color-text);
		color: #ffffff;
		border-radius: var(--radius-md);
		padding: 1rem 1.25rem;
		margin-bottom: 0.75rem;
		width: 320px;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		box-shadow: var(--shadow-lg);
		border-left: 3px solid var(--color-accent);
	}

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
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-accent);
		margin: 0;
	}

	h2 {
		font-size: 0.8rem;
		font-weight: 400;
		margin: 0;
		padding: 0.5rem 0 0.25rem;
	}

	small {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0.25rem;
	}

	.close-button:hover {
		color: #ffffff;
	}
</style>
