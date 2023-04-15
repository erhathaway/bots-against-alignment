import { writable } from 'svelte/store';
import { persisted } from 'svelte-local-storage-store';

const defaultData = {
    game_id: null,
    user_id: null,
    creator_id: null,
  };
  
  export const globalStore = persisted('settings', writable(defaultData));
  