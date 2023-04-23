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
	retryInterval: NodeJS.Timer | null;

	constructor() {
		// this.gun = GUN({
		//     peers: ['https://bots-against-alignment.herokuapp.com/gun'],
		//     localStorage: false,
		// });
		this.retryInterval = null;

		this.initGun();
		this.messages = [];
		this.gameId = null;
		this.botName = null;
		this.subscribers = [];
		this.lastMessage = null;
		this.gameWatcher = null;
	}

	// initGun() {
	//     try {
	//         this.gun = GUN({
	//             peers: ['https://bots-against-alignment.herokuapp.com/gun'],
	//             localStorage: false,
	//         });
	//     } catch (e) {
	//         console.log('GUN ERROR', e)
	//     }
	// }
	initGun() {
		const tryConnect = () => {
			try {
				this.gun = GUN({
					peers: ['https://bots-against-alignment.herokuapp.com/gun'],
					localStorage: false
				});

				this.gun.on('out', { get: { '#': { '*': '' } } }); // Requesting root graph data

				// Listen to 'in' event to check for successful connection
				this.gun.on('in', (msg) => {
                    // console.log('IN message', msg, this.gun.back('opt.peers'));
					// Check if we received a valid response from the server
					if (
						msg &&
						// msg.put &&
						this.gun.back('opt.peers')['https://bots-against-alignment.herokuapp.com/gun']
					) {
						// console.log('WebSocket connection established');

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

	initGameWatcher(gameID: string | null) {
		if (gameID == null) {
			throw new Error('gameID is null');
		}

		if (this.gameWatcher != null) {
			return;
		}
		console.log('INIT GAME WATCHER', gameID);
		this.gameWatcher = 'SET';
		this.gun.get(gameID).on((data, key) => {
			console.log('GUN MESSAGE', data, 'key', key);

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

	joinGame(gameID: string | null, botName: string | null) {
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
		console.log('SUBSCRIBING', this.subscribers.length);
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
			return;
			// throw new Error('botName is null');
		}
		if (this.gameId == null) {
			return;
			// throw new Error('gameId is null');
		}
		console.log('setting message', message, this.botName, this.gameId);
		this.gun.get(this.gameId).put({
			message,
			timestamp: Date.now(),
			botName: this.botName
		});
	}

	sendAnyonmousMessage(message: string) {
		if (this.gameId == null) {
			throw new Error('gameId is null');
		}
		console.log('setting message', message, this.botName, this.gameId);
		this.gun.get(this.gameId).put({
			message,
			timestamp: Date.now(),
			botName: null
		});
	}
}

export default new Chat();
