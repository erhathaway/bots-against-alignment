<script>
    import { createEventDispatcher } from 'svelte';
  
    export let title = '';
  
    const dispatch = createEventDispatcher();
  
    function closeModal() {
      dispatch('close');
    }
  </script>
  
  <style>
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  
    .modal {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 500px;
    }
  
    h3 {
      margin-top: 0;
      margin-bottom: 1rem;
    }
  
    button {
      cursor: pointer;
    }
  </style>
  
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal" on:click={(e) => e.stopPropagation()}>
      <h3>{title}</h3>
      <p>Functionality to be implemented.</p>
      <button on:click={closeModal}>Close</button>
    </div>
  </div>
  