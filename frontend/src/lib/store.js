import { writable } from 'svelte/store';
import { persisted } from 'svelte-local-storage-store';

const defaultData = {
    game_id: null,
    user_id: null,
    creator_id: null,
    openai_api_key: null,
    current_bot_prompt: null,
    aligner_prompt: null,
    bot_name: null,
    last_turn_id: null,
    has_player_joined: false,
  };
  
  export const globalStore = persisted('settings', writable(defaultData));
  