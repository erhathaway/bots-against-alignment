import type { Message, Subscriber } from './chat_types';

class ChatGame {
	manager: any;
	messages: Array<Message>;
	gameId: string;
	botName: string | null;
	subscribers: Array<Subscriber>;
	lastMessageKey: string | null;
	gameWatcher: any;
    seenMessages: Set<string>;

	constructor(manager: any, gameId: string) {
		if (!manager) {
			throw new Error('gun is null');
		}
		this.manager = manager;
        
		this.gameId = gameId;
		this.botName = null;
		this.messages = [];
        this.seenMessages = new Set();
		this.subscribers = [];
		this.lastMessageKey = null;
		this.gameWatcher = null;
		this.manager.enqueue(this.initGameWatcher);
		// this.initGameWatcher();
	}

	initGameWatcher = () => {
		if (!this.gameId) {
			throw new Error('gameID is null');
		}

		console.log('INIT GAME WATCHER', this.gameId);
		this.gameWatcher = 'SET';
		// setTimeout(() => {
		if (this.manager.gun == null) {
			throw new Error('**gun is null');
		}
		this.manager.gun.get(this.gameId).on((data) => {
			console.log('GUN MESSAGE', data);
            
            if (this.seenMessages.has(data.uuid)) {
                return;
            }
			this.lastMessageKey = data.uuid;
			this.messages.push(data);

			this.subscribers.forEach((callback) => callback(data, this.messages));
            this.seenMessages.add(data.uuid);
		});
		// }, 5000);
	}

	watchGame = () => {
		const _run = () => {
			if (!this.gameWatcher) {
				this.initGameWatcher();
			}
			this.sendSystemMessage('A new viewer joined', this.gameId);
		};
		this.manager.enqueue(_run);
	}

	joinGame = (botName: string) => {
        console.log('>>>>JOIN GAME', this.gameId, botName)
		const _run = () => {
			if (!this.gameWatcher) {
				this.initGameWatcher();
			}
			console.log('>>>>>JOIN GAME', this.gameId, botName);
			this.botName = botName;
			this.sendStatusMessage('joined the game', this.gameId, this.botName);
		};
		this.manager.enqueue(_run);
	}

	leaveGame() {
		const _run = () => {
            if (this.botName) {
                this.sendStatusMessage('left the game', this.gameId, this.botName);
            }
			this.subscribers = [];
			this.botName = null;

			this.manager.gun.get(this.gameId).off();
			this.gameWatcher = null;
		};
		this.manager.enqueue(_run);
	}

    createUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
              const r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          
          
          
    }

	sendMessage = (message: string, gameId: string, botName: string) => {
        const uuid = this.createUUID();
		const _run = () => {
			if (this.botName === null) {
				throw new Error('botName is null');
			}
			if (this.manager.gun == null) {
				throw new Error('2gun is null');
			}

			console.log('sending message', message, botName, gameId);
			this.manager.gun.get(gameId).put({
				message,
				timestamp: Date.now(),
				botName: botName,
				isStatusMessage: false,
                isSystemMessage: false,
                uuid
			});
		};
		this.manager.enqueue(_run);
	}

	sendStatusMessage = (message: string, gameId: string, botName: string) => {
        const uuid = this.createUUID();
		const _run = () => {
			if (botName === null) {
				throw new Error('botName is null');
			}

			console.log('sending status message', message, botName, gameId);
			this.manager.gun.get(gameId).put({
				message,
				timestamp: Date.now(),
				botName: botName,
				isStatusMessage: true,
                isSystemMessage: false,
                uuid
			});
		};
		this.manager.enqueue(_run);
	}

    sendSystemMessage = (message: string, gameId: string) => {
        const uuid = this.createUUID();
		const _run = () => {
			// if (this.botName === null) {
			// 	throw new Error('botName is null');
			// }

			console.log('sending system message', message);
			this.manager.gun.get(gameId).put({
				message,
				timestamp: Date.now(),
				botName: null,
				isStatusMessage: false,
                isSystemMessage: true,
                uuid
			});
		};
		this.manager.enqueue(_run);
	}


        

	// sendAnonymousMessage = (message: string) => {
	// 	const _run = () => {
	// 		console.log('sending anonymous message', message, this.gameId);
	// 		this.manager.gun.get(this.gameId).put({
	// 			message,
	// 			timestamp: Date.now(),
	// 			botName: null,
	// 			isStatusMessage: false,
    //             isSystemMessage: false,
    //             uuid
	// 		});
	// 	};
	// 	this.manager.enqueue(_run);
	// }

	subscribe = (callback: Subscriber) => {
		this.subscribers.push(callback);
		console.log('SUBSCRIBING', this.subscribers.length);
	}
}

export default ChatGame;
