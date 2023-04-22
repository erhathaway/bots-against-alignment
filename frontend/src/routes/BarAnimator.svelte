<script>
    import { onMount } from 'svelte';
    
    export let duration = 1; // duration in seconds
    export let onFinish;
    
  
    let progress = 0;
  
    onMount(() => {
      const interval = setInterval(() => {
        progress += 100 / (duration * 60);
        if (progress >= 100) {
          clearInterval(interval);
          progress = 100;
          if (typeof onFinish === 'function') {
            onFinish();
          }
        }
      }, 1000 / 60); // 60 FPS
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
    }
  </style>
  
  <div class="bar-container">
    <div class="bar" style="width: {progress}%;"></div>
  </div>