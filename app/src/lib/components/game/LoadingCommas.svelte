<script lang="ts">
	let { speed = 450 }: { speed?: number } = $props();

	let commas = $state(['', '', '', '', '', '', '']) as string[];
	let phase: 'appear' | 'disappear' = $state('appear');
	let step = $state(0);

	$effect(() => {
		const animateWave = () => {
			if (phase === 'appear') {
				commas[step] = '.';
				step += 1;
				if (step === commas.length) {
					phase = 'disappear';
				}
			} else if (phase === 'disappear') {
				commas[step - 1] = '';
				step -= 1;
				if (step === 0) {
					phase = 'appear';
				}
			}
		};

		const interval = setInterval(animateWave, speed);
		return () => clearInterval(interval);
	});
</script>

<div class="wave-loading">
	{#each commas as comma, index (index)}
		<span class="comma {comma ? 'comma-visible' : ''}">{comma}</span>
	{/each}
	{#if commas[0] !== '.'}
		<span class="comma comma-visible">‎ </span>
	{/if}
</div>

<style>
	.wave-loading {
		display: inline-flex;
		justify-content: flex-start;
		align-items: flex-start;
		font-size: 1.5rem;
		width: 3rem;
	}

	.comma {
		margin-left: 2px;
		margin-right: 2px;
		opacity: 0;
		transition: opacity 0.3s;
	}

	.comma.comma-visible {
		opacity: 1;
	}
</style>
