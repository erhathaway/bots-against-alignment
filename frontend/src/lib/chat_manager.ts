import GUN from 'gun';

import ChatGame from './chat_game';
import { isRecord, type GunInstance } from './types';

function isGunInstance(
	value: { on?: Function; get?: Function; back?: Function } | null
): value is GunInstance {
	return (
		(typeof value === 'object' || typeof value === 'function') &&
		value !== null &&
		typeof value.on === 'function' &&
		typeof value.get === 'function' &&
		typeof value.back === 'function'
	);
}

class ChatManager {
	gun: GunInstance | null;
	gameChats: Map<string, ChatGame>;
	retryInterval: ReturnType<typeof setInterval> | null;
	sideEffectQueue: Array<() => void>;
	peerUrl: string;

	constructor() {
		this.retryInterval = null;
		this.gun = null;
		this.peerUrl =
			import.meta.env.VITE_GUN_PEER?.trim() || 'https://bots-against-alignment.herokuapp.com/gun';
		this.initGun();
		this.gameChats = new Map();
		this.sideEffectQueue = [];
		this.runSideEffects();
	}

	initGun() {
		const tryConnect = () => {
			try {
				const gun = GUN({
					peers: [this.peerUrl],
					localStorage: false
				});

				if (!isGunInstance(gun)) {
					throw new Error('Failed to initialize Gun client');
				}
				this.gun = gun;

				this.gun.on('out', { get: { '#': { '*': '' } } }); // Requesting root graph data

				// Listen to 'in' event to check for successful connection
				this.gun.on('in', (msg) => {
					const gun = this.gun;
					if (!gun) return;

					const peers = gun.back('opt.peers');
					const isConnected =
						Boolean(msg) && isRecord(peers) && Boolean(peers[this.peerUrl]);

					if (this.gun && isConnected) {
						if (this.retryInterval) {
							clearInterval(this.retryInterval);
							this.retryInterval = null;
						}
					} else {
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
					const fn = this.sideEffectQueue.shift();
					if (fn) {
						fn();
					}
				}
			}
		}, 1000);
	};

	enqueue = (fn: () => void): void => {
		// Most side effects can run immediately once the Gun instance exists; keep the
		// queue as a fallback for the very early initialization window.
		if (this.gun) {
			fn();
			return;
		}
		this.sideEffectQueue.push(fn);
	};

	findOrCreateChatGame(gameId: string): ChatGame {
		const existing = this.gameChats.get(gameId);
		if (existing) return existing;

		const chatGame = new ChatGame(this, gameId);
		this.gameChats.set(gameId, chatGame);
		return chatGame;
	}

	deleteChatGame(gameId: string): void {
		if (this.gameChats.has(gameId)) {
			this.gameChats.delete(gameId);
		}
	}
}

export default new ChatManager();
