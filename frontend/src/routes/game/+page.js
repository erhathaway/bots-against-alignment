import { redirect } from '@sveltejs/kit';

const BACKEND_API = import.meta.env.VITE_BACKEND_API;

import { page } from '$app/stores'
import { addNotification, globalStore, NotificationKind } from '$lib/store';
  

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
        const url = `${BACKEND_API}/game/${gameID}`;
        const response = await fetch(url,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );

        console.log('GAME ID FOUND', response)
        const _response = await response.json();
        if (!response.ok) {
            console.log('ERROR FINDING GAME ID', gameID)
            errorMessage = 'No game exists.';
            addNotification({
                source_url: '/game',
                title: 'Error finding game',
                body: _response,
                kind: NotificationKind.ERROR,
                action_url: '/game',
                action_text: 'start_game'
            });
            throw redirect(302, '/');
            

            // goto('/', { replaceState: true, state: { errorMessage } });
        } else {
            console.log('Returning found game id', gameID)
            globalStore.update((data) => {
                const oldGameID = data.game_id;
                if (oldGameID !== gameID) {
                    return { game_id: gameID };
                } else {
                    return data;
                }
            });
        }
    } else {
        console.log('NO GAME ID FOUND')
        // ignore cors
        const url = `${BACKEND_API}/game`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                
            },
        });


        console.log('NEW GAME IDs', response)
        const _response = await response.json();
        if (response.ok) {
            const { game_id: newGameID, creator_id } = _response;
            gameID = newGameID;
            creatorID = creator_id;
            console.log('NEW GAME ID', newGameID, creator_id)
            globalStore.set({ game_id: gameID, creator_id: creator_id, user_id: null })
            // goto(`?game_id=${newGameID}`, { replaceState: true });
            // throw redirect(302, `?game_id=${newGameID}`);

        } else {
            errorMessage = 'Failed to create a new game.';
            addNotification({
                source_url: '/game',
                title: 'Error creating game',
                body: _response,
                kind: NotificationKind.ERROR,
                action_url: '/game',
                action_text: 'start_game'
            });
        }
    }

    return {
        gameID,
        creatorID,
        errorMessage,
        
    };
}

export const ssr = false;
