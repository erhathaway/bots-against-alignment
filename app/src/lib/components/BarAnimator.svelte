<script lang="ts">
	let { duration = 1, onFinish }: { duration?: number; onFinish?: () => void } = $props();

	$effect(() => {
		if (typeof onFinish !== 'function') return;
		const timeout = setTimeout(onFinish, duration * 1000);
		return () => clearTimeout(timeout);
	});
</script>

<style>
  .bar-container {
      width: 100%;
      height: 5px;
      background-color: #f0f0f0;
      border-radius: 5px;
      overflow: hidden;
  }
  .bar {
      height: 100%;
      background-color: #0a6;
      width: 0;
      animation: progress-animation calc(var(--duration) * 1s) linear forwards;
  }

  @keyframes progress-animation {
      0% {
          width: 0;
      }
      100% {
          width: 100%;
      }
  }
</style>

<div class="bar-container">
  <div class="bar" style="--duration: {duration};"></div>
</div>
