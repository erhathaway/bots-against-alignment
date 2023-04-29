<script lang="ts">
    import { onDestroy } from "svelte";
    // import { navigate } from "svelte-routing";
    const BACKEND_API = import.meta.env.VITE_BACKEND_API;
    import { globalStore } from '$lib/store';

    import {goto} from '$app/navigation';

    let imageUrl = "";
    let imageText = "";
  
    async function fetchImageAndText() {
      try {
        const response = await fetch(`${BACKEND_API}/api/image_and_text`);
        const data = await response.json();
        if (response.ok) {
          imageUrl = data.imageUrl;
          imageText = data.imageText;
        } else {
          console.error("Failed to get image and text");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
  
    function playAgain() {
      globalStore.set({});
    }
  
    function endGame() {
      goto("/");
    }
  
    onDestroy(async () => {
      await fetchImageAndText();
    });
  </script>
  
  <div class="game-finale">
    turn finale

    <div class="image-container">
      <img src="{imageUrl}" alt="Robot image" />
      <div class="image-text">{imageText}</div>
    </div>
    <div class="button-container">
      <button on:click={playAgain}>Play Again</button>
      <button on:click={endGame}>End</button>
    </div>
  </div>
  
  <style>
    .game-finale {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .image-container {
      position: relative;
    }
    .image-text {
      position: absolute;
      bottom: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px;
    }
    .button-container {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-top: 20px;
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      border: 1px solid black;
      background-color: black;
      color: white;
      border-radius: 5px;
      box-shadow: 0px 5px 10px -3px rgba(0, 0, 0, 0.2);
    }
    button:hover {
      background-color: white;
      color: black;
    }
  </style>
  