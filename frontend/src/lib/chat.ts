import GUN, { type IGun, type IGunInstance } from 'gun';
import { writable } from 'svelte/store';


class Chat {
    gun: IGunInstance;
    messages: Array<any>;
    gameId: string | null;
    botName: string | null;
    subscribers: Array<any>;
    lastMessage: Object | null;
    gameWatcher: any;

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
        this.gameWatcher = null
    }

    initGameWatcher(gameID: string | null) {
        if (gameID == null) {
            throw new Error('gameID is null');
        }

        if (this.gameWatcher != null) {
            return
        }
        console.log('INIT GAME WATCHER', gameID)
        this.gameWatcher = 'SET'
        this.gun.get(gameID).on((data, key) => {
            console.log('GUN MESSAGE', data, 'key', key);
            // if (key === this.lastMessage) {
            //     return;
            // }
            this.lastMessage = key;
            this.messages.push(data);

            this.subscribers.forEach((callback) => callback(data, this.messages));

        });
    }

    watchGame(gameID: string | null) {
        this.gameId = gameID;
        if (gameID == null) {
            throw new Error('gameID is null');
        }

        this.initGameWatcher(gameID);
        this.sendAnyonmousMessage('A new viewer joined');

    }

    joinGame(gameID: string, botName: string) {
        this.gameId = gameID;
        this.botName = botName;
        if (gameID == null) {
            throw new Error('gameID is null');
        }

        this.initGameWatcher(gameID);
        this.sendMessage('joined the game');
    }

    subscribe(callback: Function) {
        this.subscribers.push(callback);
        console.log('SUBSCRIBING', this.subscribers.length)

    }


    leaveGame() {
        if (this.gameId == null) {
            throw new Error('gameId is null');
        }
        this.sendMessage('left the game');
        this.gun.get(this.gameId).off();
        this.subscribers = [];
    }

    
    sendMessage(message: string) {
        if (this.botName == null) {
            return
            // throw new Error('botName is null');
        }
        if (this.gameId == null) {
            return
            // throw new Error('gameId is null');
        }
        console.log('setting message', message, this.botName, this.gameId, )
        this.gun.get(this.gameId).put({
            message,
            timestamp: Date.now(),
            botName: this.botName,
        });


    }

    sendAnyonmousMessage(message: string) {
        if (this.gameId == null) {
            throw new Error('gameId is null');
        }
        console.log('setting message', message, this.botName, this.gameId, )
        this.gun.get(this.gameId).put({
            message,
            timestamp: Date.now(),
            botName: null,
        });
    }
}

export default new Chat();