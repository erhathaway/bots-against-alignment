import GUN from 'gun';

import ChatGame from './chat_game';
import { isRecord, type GunInstance } from './types';
import { env } from '$env/dynamic/public';

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
	sideEffectQueue: Array<() => void>;
	peerUrl: string;
	isConnected: boolean;

	constructor() {
		this.gun = null;
		this.peerUrl = env.PUBLIC_GUN_PEER?.trim() || 'https://bots-against-alignment.herokuapp.com/gun';
		this.isConnected = false;
		this.gameChats = new Map();
		this.sideEffectQueue = [];
		this.initGun();
		this.runSideEffects();
	}

	initGun() {
		try {
			const gun = GUN({
				peers: [this.peerUrl],
				localStorage: false
			});

			if (!isGunInstance(gun)) {
				throw new Error('Failed to initialize Gun client');
			}
			this.gun = gun;

			// Gun handles WebSocket reconnection internally.
			// We just track connection status via the 'in' event.
			this.gun.on('in', (msg) => {
				const gun = this.gun;
				if (!gun) return;

				const peers = gun.back('opt.peers');
				const connected =
					Boolean(msg) && isRecord(peers) && Boolean(peers[this.peerUrl]);

				this.isConnected = connected;
			});
		} catch (e) {
			console.error('GUN initialization error:', e);
		}
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
