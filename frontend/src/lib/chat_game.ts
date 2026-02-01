import { isRecord, type ChatManagerLike, type GunChain, type JsonValue, type Message, type Subscriber } from './types';

function parseMessage(value: JsonValue): Message | null {
	if (!isRecord(value)) return null;

	const message = value.message;
	const timestamp = value.timestamp;
	const uuid = value.uuid;

	if (typeof message !== 'string' || typeof timestamp !== 'number' || typeof uuid !== 'string') return null;

	const botNameRaw = value.botName;
	const botName = typeof botNameRaw === 'string' ? botNameRaw : null;

	// Gun sometimes omits `false` values when serializing nodes; default to `false` if missing.
	const isStatusMessage = typeof value.isStatusMessage === 'boolean' ? value.isStatusMessage : false;
	const isSystemMessage = typeof value.isSystemMessage === 'boolean' ? value.isSystemMessage : false;

	return {
		message,
		timestamp,
		botName,
		isStatusMessage,
		isSystemMessage,
		uuid
	};
}

class ChatGame {
	manager: ChatManagerLike;
	messages: Array<Message>;
	gameId: string;
	botName: string | null;
	subscribers: Array<Subscriber>;
	lastMessageKey: string | null;
	gameWatcher: GunChain | null;
	seenMessages: Set<string>;

	constructor(manager: ChatManagerLike, gameId: string) {
		this.manager = manager;

		this.gameId = gameId;
		this.botName = null;
		this.messages = [];
		this.seenMessages = new Set();
		this.subscribers = [];
		this.lastMessageKey = null;
		this.gameWatcher = null;
		this.manager.enqueue(this.initGameWatcher);
	}

	initGameWatcher = () => {
		if (!this.gameId) {
			throw new Error('gameID is null');
		}

		if (this.manager.gun == null) {
			throw new Error('**gun is null');
		}

		if (import.meta.env.VITE_E2E) {
			// eslint-disable-next-line no-console
			console.log('[chat] initGameWatcher', this.gameId);
		}

		const gameNode = this.manager.gun.get(this.gameId);
		this.gameWatcher = gameNode;

		gameNode.on((data: JsonValue) => {
			if (import.meta.env.VITE_E2E) {
				// eslint-disable-next-line no-console
				console.log('[chat] incoming raw', data);
			}
			const newMessage = parseMessage(data);
			if (!newMessage) return;

			if (this.seenMessages.has(newMessage.uuid)) {
				return;
			}
			this.lastMessageKey = newMessage.uuid;
			this.messages.push({ ...newMessage });

			this.subscribers.forEach((callback) => callback(newMessage, this.messages));
			this.seenMessages.add(newMessage.uuid);
		});
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
		const _run = () => {
			if (!this.gameWatcher) {
				this.initGameWatcher();
			}
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

			if (this.manager.gun == null) {
				throw new Error('gun is null');
			}
			if (this.gameWatcher && typeof this.gameWatcher.off === 'function') {
				this.gameWatcher.off();
			} else {
				this.manager.gun.get(this.gameId).off();
			}
			this.gameWatcher = null;
		};
		this.manager.enqueue(_run);
	}

	createUUID = () => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	};

	sendMessage = (message: string, gameId: string, botName: string) => {
		const uuid = this.createUUID();
		const _run = () => {
			if (this.botName === null) {
				throw new Error('botName is null');
			}
			if (this.manager.gun == null) {
				throw new Error('2gun is null');
			}

			if (import.meta.env.VITE_E2E) {
				// eslint-disable-next-line no-console
				console.log('[chat] put message', { gameId, botName, message, uuid });
			}
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
			if (this.manager.gun == null) {
				throw new Error('gun is null');
			}
			if (import.meta.env.VITE_E2E) {
				// eslint-disable-next-line no-console
				console.log('[chat] put status', { gameId, botName, message, uuid });
			}
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
			if (this.manager.gun == null) {
				throw new Error('gun is null');
			}
			if (import.meta.env.VITE_E2E) {
				// eslint-disable-next-line no-console
				console.log('[chat] put system', { gameId, message, uuid });
			}
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
	};

	subscribe = (callback: Subscriber) => {
		this.subscribers.push(callback);
	}
}

export default ChatGame;
