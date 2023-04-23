import GUN from 'gun';
import { writable } from 'svelte/store';


class Chat {
    constructor() {
        this.gun = GUN({
            peers: ['https://bots-against-alignment.herokuapp.com/gun'],
            localStorage: false,
        });
        this.messages = [];
        this.gameId = null;
        this.botName = null;
        this.subscribers = [];
        this.lastMessage = null;
    }

    joinGame(gameID, botName) {
        this.gameId = gameID;
        this.botName = botName;
        if (gameID == null) {
            throw new Error('gameID is null');
        }

        this.gun.get(gameID).on((data, key) => {
            console.log('GUN MESSAGE', data, 'key', key);
            // if (key === this.lastMessage) {
            //     return;
            // }
            this.lastMessage = key;
            this.messages.push(data);

            this.subscribers.forEach((callback) => callback(data, this.messages));
            
        });
        this.sendMessage('joined the game');
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        console.log('SUBSCRIBING', this.subscribers.length)

    }


    leaveGame() {
        this.sendMessage('left the game');
        this.gun.get(this.gameId).off();
        this.subscribers = [];
    }

    
    sendMessage(message) {
        console.log('setting message', message, this.botName, this.gameId, )
        this.gun.get(this.gameId).put({
            message,
            timestamp: Date.now(),
            botName: this.botName,
        });


    }
}

export default new Chat();