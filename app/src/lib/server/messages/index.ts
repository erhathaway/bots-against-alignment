/**
 * Message System - Entry point and initialization
 */

export * from './types';
export * from './service';
export * from './queue';
export { processStateChange } from './processor';

import { messageQueue } from './queue';
import { processStateChange } from './processor';

// Initialize the state processor
messageQueue.setStateProcessor(processStateChange);
