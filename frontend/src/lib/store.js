import { writable } from 'svelte/store';
import { localStorageWritable } from 'svelte-local-storage-store';

const defaultData = {
    game_id: null,
    user_id: null,
    creator_id: null,
  };
  
  export const globalStore = localStorageWritable('bots-against-alignment', writable(defaultData));
  