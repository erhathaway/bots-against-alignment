import { redirect } from '@sveltejs/kit';

const BACKEND_API = import.meta.env.VITE_BACKEND_API;

import { page } from '$app/stores'
import { globalStore } from '$lib/store.js';
  

export async function load({ params, fetch,  url}) {
    console.log('CALLING LOAD', BACKEND_API, url)

    let gameID = null
    let creatorID = null
    url.searchParams.forEach((value, key) => {
        // console.log('URL PARAMS', key, value)
        if (key === 'game_id') {
            gameID = value;
        }
    });
    let errorMessage;

    if (gameID) {
        console.log('GAME ID FOUND', gameID)
        const response = await fetch(`${BACKEND_API}/game/${gameID}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );

        console.log('GAME ID FOUND', response)
        if (!response.ok) {
            
            errorMessage = 'No game exists.';
            throw redirect(302, '/');
            

            // goto('/', { replaceState: true, state: { errorMessage } });
        } else {
            globalStore.set({ game_id: gameID, creator_id: null, user_id: null })
        }
    } else {
        console.log('NO GAME ID FOUND')
        // ignore cors
        const response = await fetch(`${BACKEND_API}/game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                
            },
        });


        console.log('NEW GAME IDs', response)
        if (response.ok) {
            const { game_id: newGameID, creator_id } = await response.json();
            gameID = newGameID;
            creatorID = creator_id;
            console.log('NEW GAME ID', newGameID, creator_id)
            globalStore.set({ game_id: gameID, creator_id: creator_id, user_id: null })
            // goto(`?game_id=${newGameID}`, { replaceState: true });
            // throw redirect(302, `?game_id=${newGameID}`);

        } else {
            errorMessage = 'Failed to create a new game.';
        }
    }

    return {
        gameID,
        creatorID,
        errorMessage,
        
    };
}