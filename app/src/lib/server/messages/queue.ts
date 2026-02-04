/**
 * Message Queue System - Handles buffered and instant message publishing
 *
 * MessageQueue orchestrates message publishing across games.
 * BufferedQueue manages sequential time windows for buffered messages.
 */

import type { GameMessage, CreateMessageInput } from './types';
import { createMessage } from './types';
import { insertMessage, publishMessage } from './service';

/**
 * Per-game buffered message queue with sequential time windows.
 */
class BufferedQueue {
	private gameId: string;
	private queue: GameMessage[] = [];
	private processing: boolean = false;
	private processTimeout: NodeJS.Timeout | null = null;

	constructor(gameId: string) {
		this.gameId = gameId;
	}

	/**
	 * Enqueue a buffered message and start processing if not already running.
	 */
	async enqueue(message: GameMessage): Promise<void> {
		// Insert message into DB (unpublished)
		const inserted = await insertMessage(message);
		this.queue.push(inserted);

		// Start processing if not already running
		if (!this.processing) {
			this.processQueue();
		}
	}

	/**
	 * Process queued messages sequentially with time windows.
	 */
	private async processQueue(): Promise<void> {
		this.processing = true;

		while (this.queue.length > 0) {
			const message = this.queue.shift()!;
			const now = Date.now();
			const duration = message.bufferDuration ?? 5000;
			const windowEndsAt = now + duration;

			// Publish message
			await publishMessage(message.id!, now, windowEndsAt);

			// Process metadata state changes (if any)
			if (message.metadata?.stateChange) {
				await messageQueue.processStateChange(message);
			}

			// Wait for buffer window
			await new Promise<void>((resolve) => {
				this.processTimeout = setTimeout(resolve, duration);
			});
		}

		this.processing = false;
		this.processTimeout = null;
	}

	/**
	 * Check if the queue is currently processing messages.
	 */
	isProcessing(): boolean {
		return this.processing;
	}

	/**
	 * Get the number of pending messages.
	 */
	getPendingCount(): number {
		return this.queue.length;
	}

	/**
	 * Stop processing (used for cleanup/shutdown).
	 */
	stop(): void {
		if (this.processTimeout) {
			clearTimeout(this.processTimeout);
			this.processTimeout = null;
		}
		this.processing = false;
	}
}

/**
 * Global message queue orchestrator.
 * Manages buffered queues per game and handles instant message publishing.
 */
class MessageQueue {
	private queues: Map<string, BufferedQueue> = new Map();
	private stateProcessor: ((message: GameMessage) => Promise<void>) | null = null;

	/**
	 * Set the state change processor (injected to avoid circular dependency).
	 */
	setStateProcessor(processor: (message: GameMessage) => Promise<void>): void {
		this.stateProcessor = processor;
	}

	/**
	 * Publish a message (instant or buffered).
	 */
	async publish(input: CreateMessageInput): Promise<void> {
		const message = createMessage(input);

		if (message.channel === 'instant') {
			await this.publishInstant(message);
		} else {
			await this.enqueueBuffered(message);
		}
	}

	/**
	 * Publish an instant message immediately.
	 */
	private async publishInstant(message: GameMessage): Promise<void> {
		const now = Date.now();
		message.publishedAt = now;
		message.windowEndsAt = null;

		// Insert and publish in one step
		const inserted = await insertMessage(message);

		// Process metadata state changes
		if (inserted.metadata?.stateChange) {
			await this.processStateChange(inserted);
		}
	}

	/**
	 * Enqueue a buffered message.
	 */
	private async enqueueBuffered(message: GameMessage): Promise<void> {
		const queue = this.getOrCreateQueue(message.gameId);
		await queue.enqueue(message);
	}

	/**
	 * Get or create a buffered queue for a game.
	 */
	private getOrCreateQueue(gameId: string): BufferedQueue {
		if (!this.queues.has(gameId)) {
			this.queues.set(gameId, new BufferedQueue(gameId));
		}
		return this.queues.get(gameId)!;
	}

	/**
	 * Process state change metadata (delegates to StateChangeProcessor).
	 */
	async processStateChange(message: GameMessage): Promise<void> {
		if (!this.stateProcessor) {
			console.warn('[MessageQueue] State processor not set, skipping state change');
			return;
		}
		await this.stateProcessor(message);
	}

	/**
	 * Get queue stats for a game (useful for debugging).
	 */
	getQueueStats(gameId: string): { processing: boolean; pendingCount: number } {
		const queue = this.queues.get(gameId);
		if (!queue) {
			return { processing: false, pendingCount: 0 };
		}
		return {
			processing: queue.isProcessing(),
			pendingCount: queue.getPendingCount()
		};
	}

	/**
	 * Stop all queues (cleanup on shutdown).
	 */
	stopAll(): void {
		for (const queue of this.queues.values()) {
			queue.stop();
		}
		this.queues.clear();
	}
}

// Global singleton instance
export const messageQueue = new MessageQueue();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
	process.on('SIGTERM', () => {
		console.log('[MessageQueue] Stopping all queues...');
		messageQueue.stopAll();
	});
}
