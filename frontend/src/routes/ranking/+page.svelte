<script>
    import { onMount } from "svelte";
    import { globalStore } from '$lib/store.js';

	const BACKEND_API = import.meta.env.VITE_BACKEND_API;
    let alignmentResponses = [];
	let game_id = $globalStore.game_id;
	let user_id = $globalStore.user_id;
    let bot_name = $globalStore.bot_name;
    let last_turn_id = $globalStore.last_turn_id;
  
    async function fetchData() {
      try {
        const response = await fetch(
          `${BACKEND_API}/turn_finale?game_id=${game_id}&turn_id=${last_turn_id}`
        );
        const data = await response.json();
        alignmentResponses = data.alignment_responses;
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
  
    onMount(fetchData);
  </script>
  
  <div>
    <h2>Alignment Responses</h2>
    <ul>
      {#each alignmentResponses as response (response[user_id]["user_id"])}
        <li>
          <!-- <strong>Bot Name:</strong> {response[user_id]["bot_name"]}<br /> -->
          <strong>User ID:</strong> {response[user_id]["user_id"]}<br />
          <strong>Text:</strong> {response["text"]}<br />
          <strong>Is Round Winner:</strong> {response["is_round_winner"] ? "Yes" : "No"}<br />
          <!-- <strong>Is Global Winner:</strong> {response["is_global_winner"] ? "Yes" : "No"} -->
        </li>
      {/each}
    </ul>
  </div>