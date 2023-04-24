// import type { IGunInstance } from 'gun';
import GUN, { type IGun, type IGunInstance } from 'gun';

import ChatGame from './chat_game';

class ChatManager {
	gun: IGunInstance | null;
	gameChats: Map<string, ChatGame>;
	retryInterval: NodeJS.Timer | null;
	sideEffectQueue: Array<() => void>;

	constructor() {
		this.retryInterval = null;
        this.gun = null;
		this.initGun();
		this.gameChats = new Map();
		this.sideEffectQueue = [];
        this.runSideEffects();
	}

	initGun() {
		const tryConnect = () => {
			try {
                console.log('TRYING TO CONNECT TO GUN')
				this.gun = GUN({
					peers: ['https://bots-against-alignment.herokuapp.com/gun'],
					localStorage: false
				});
                console.log('GUN INITIALIZED', this.gun)

				this.gun.on('out', { get: { '#': { '*': '' } } }); // Requesting root graph data

				// Listen to 'in' event to check for successful connection
				this.gun.on('in', (msg) => {
					if (
                        this.gun && 
						msg &&
						this.gun.back('opt.peers')['https://bots-against-alignment.herokuapp.com/gun']
					) {
						if (this.retryInterval) {
							clearInterval(this.retryInterval);
							this.retryInterval = null;
						}
					} else {
						console.log('WebSocket connection failed');

						if (!this.retryInterval) {
							this.retryInterval = setInterval(() => {
								console.log('Retrying WebSocket connection...');
								tryConnect();
							}, 10000); // Retry every 10 seconds
						}
					}
				});
			} catch (e) {
				console.log('GUN ERROR', e);
			}
		};

		// Initiate the first connection attempt
		tryConnect();
	}

	runSideEffects = () => {
		setInterval(() => {
            if (this.gun) {
                while (this.sideEffectQueue.length > 0) {
                    console.log('RUNNING SIDE EFFECTS')
					const fn = this.sideEffectQueue.shift();
					if (fn) {
						fn();
					}
				}
			}
		}, 1000);
	}

	enqueue = (fn: () => void): void => {
		this.sideEffectQueue.push(fn);
	}

	findOrCreateChatGame(gameId: string): ChatGame {
		if (this.gameChats.has(gameId)) {
			return this.gameChats.get(gameId) as ChatGame;
		}

		const chatGame = new ChatGame(this, gameId);
		this.gameChats.set(gameId, chatGame);
		return chatGame;
	}

	// getChatGame(gameId: string): ChatGame | null {
	//   if (this.gameChats.has(gameId)) {
	//     return this.gameChats.get(gameId) as ChatGame;
	//   }
	//   return null;
	// }

	deleteChatGame(gameId: string): void {
		if (this.gameChats.has(gameId)) {
			this.gameChats.delete(gameId);
		}
	}
}

export default new ChatManager();
