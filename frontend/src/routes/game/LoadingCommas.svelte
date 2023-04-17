<!-- WaveLoading.svelte -->
<script>
    import { onMount } from "svelte";
  
    let animationInterval;
    let commas = ["", "", "", "", "", "", ""];
    let state = "appear";
    let step = 0;
  
    onMount(() => {
      const animateWave = () => {
        if (state === "appear") {
          commas[step] = ".";
          step++;
          if (step === commas.length) {
            state = "disappear";
          }
        } else if (state === "disappear") {
          commas[step - 1] = "";
          step--;
          if (step === 0) {
            state = "appear";
          }
        }
      };
  
      animationInterval = setInterval(animateWave, 450);
  
      return () => clearInterval(animationInterval);
    });
  </script>
  
  <style>
    .wave-loading {
      display: inline-flex;
      justify-content: flex-start;
      align-items: flex-start;
      font-size: 2rem;
      width: 5rem;
    }
  
    .comma {
      margin-left: 2px;
      margin-right: 2px;
      opacity: 0;
      transition: opacity 0.3s;
    }
  
    .comma.comma-visible {
      opacity: 1;
      /* font-size: 10.5rem; */
    }
  </style>
  
  <div class="wave-loading">
    {#each commas as comma, index (index)}
      <span class="comma {comma ? 'comma-visible' : ''}">{comma}</span>
    {/each}
  </div>