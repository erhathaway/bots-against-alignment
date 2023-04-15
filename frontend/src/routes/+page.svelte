<script>
    import { onMount } from 'svelte';
    import NewGameModal from './NewGameModal.svelte';
  
    let showModal = false;
    let modalTitle = '';
  
    function openModal(title) {
      modalTitle = title;
      showModal = true;
    }
  </script>
  
  <style>
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  
    h2 {
      font-size: 2rem;
      margin-bottom: 2rem;
    }
  
    button {
      font-size: 1.5rem;
      padding: 0.75rem 1.5rem;
      margin: 0 0.5rem;
      cursor: pointer;
    }
  
    .buttons-container {
      display: flex;
      justify-content: center;
    }
  </style>
  
  <main>
    <h1>Bots Against Alignment</h1>
    <h2>A turn-based multiplayer game where users compete to align their bot to the massively unaligned Aligner</h2>
  
    <div class="buttons-container">
      <button on:click={() => openModal('Join Game')}>Join Game</button>
      <button on:click={() => openModal('New Game')}>New Game</button>
    </div>
  
    {#if showModal}
      <NewGameModal title="{modalTitle}" on:close={() => (showModal = false)} />
    {/if}
  </main>