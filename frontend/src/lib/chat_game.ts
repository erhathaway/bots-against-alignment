import type { Message, Subscriber } from './chat_types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isMessage(value: unknown): value is Message {
	if (!isRecord(value)) return false;
	return (
		typeof value.message === 'string' &&
		typeof value.timestamp === 'number' &&
		(typeof value.botName === 'string' || value.botName === null) &&
		typeof value.isStatusMessage === 'boolean' &&
		typeof value.isSystemMessage === 'boolean' &&
		typeof value.uuid === 'string'
	);
}

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
	}

	initGameWatcher = () => {
		if (!this.gameId) {
			throw new Error('gameID is null');
		}

		this.gameWatcher = 'SET';
		if (this.manager.gun == null) {
			throw new Error('**gun is null');
		}
		this.manager.gun.get(this.gameId).on((data: unknown) => {
			if (!isMessage(data)) return;
			const newMessage = { ...data };

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
			this.manager.gun.get(this.gameId).off();
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
