# Game Flow Specification: Message-Driven State System

## Overview

The game uses a **dual-channel message system** where messages drive game state transitions. Messages are published to either a **buffered channel** (with sequential time windows) or an **instant channel** (immediate delivery). Game state changes are triggered by message metadata, creating a declarative event-driven architecture.

## Core Concepts

### 1. Message Channels

#### Buffered Channel
- Messages are queued with a time window (buffer duration)
- While a buffered message is "active" (within its window), no other buffered messages can be published
- Instant messages can interrupt/interleave at any time
- Multiple buffered messages stack their windows sequentially
- Example: 3 messages with 30s buffers = 90s total before all are visible

#### Instant Channel
- Published immediately upon creation
- No queueing or windowing
- Always visible to clients instantly
- Used for time-sensitive or interactive events

### 2. Message Structure

```typescript
interface GameMessage {
  id: number;                    // Auto-increment ID
  gameId: string;
  channel: 'buffered' | 'instant';
  type: MessageType;
  senderName?: string;           // Display name for chat
  content: string;               // Text content or JSON payload
  metadata?: MessageMetadata;    // Triggers game state changes
  bufferDuration?: number;       // Milliseconds (buffered only)
  publishedAt?: number;          // Timestamp when published to clients
  windowEndsAt?: number;         // publishedAt + bufferDuration
  createdAt: number;             // Timestamp when created
}

type MessageType =
  // Instant messages
  | 'player_joined'
  | 'player_left'
  | 'countdown_started'
  | 'game_started'
  | 'aligner_prompt_submitted'
  | 'chat'

  // Buffered messages
  | 'turn_started'
  | 'bot_response'
  | 'aligner_deliberation'
  | 'round_winner'
  | 'standings'
  | 'game_over';

interface MessageMetadata {
  stateChange?: GameStateChange;
  data?: Record<string, unknown>;
}

interface GameStateChange {
  action: StateAction;
  payload?: Record<string, unknown>;
}

type StateAction =
  | 'start_countdown'
  | 'start_game'
  | 'start_aligner_setup'
  | 'complete_aligner_setup'
  | 'start_turn'
  | 'submit_bot_response'
  | 'complete_turn'
  | 'award_point'
  | 'end_game';
```

### 3. Buffer Configuration

Default buffer durations (configurable per message):

| Message Type | Duration | Rationale |
|--------------|----------|-----------|
| `turn_started` | 5s | Let players see the turn prompt |
| `bot_response` | 5s | Show each bot's answer individually |
| `aligner_deliberation` | 2s | Stream aligner's dramatic sentences |
| `round_winner` | 7s | Highlight winner with drama |
| `standings` | 5s | Show scoreboard |
| `game_over` | 10s | Final celebration screen |

## Architecture

### Current vs New System

#### Current System
```
User Action → API Endpoint → Service Layer → Database Write
                                ↓
                         (Side effect) Post Chat Message
                                ↓
                          Chat Polling (1.5s)
                                ↓
                          Client Receives & Renders
```

#### New System
```
User Action → API Endpoint → Service Layer → Create Message (with metadata)
                                ↓
                         Message Queue Processor
                                ↓
                    ┌───────────┴───────────┐
                Instant                 Buffered
                    ↓                       ↓
            Publish immediately    Queue with time window
                    ↓                       ↓
            Database Write          Wait for window
                    │                       ↓
                    │               Publish when ready
                    │                       ↓
                    └──────────┬────────────┘
                               ↓
                    Process Message Metadata
                               ↓
                    Trigger State Changes (if any)
                               ↓
                    Update Game/Player Records
                               ↓
                    Client Polls & Receives
```

### 4. Message Queue System

```typescript
class MessageQueue {
  private queues: Map<string, BufferedQueue> = new Map();

  async publish(message: GameMessage): Promise<void> {
    if (message.channel === 'instant') {
      await this.publishInstant(message);
    } else {
      await this.enqueueBuffered(message);
    }
  }

  private async publishInstant(message: GameMessage): Promise<void> {
    // 1. Write to database with publishedAt = now()
    await db.insert(gameMessages).values({
      ...message,
      publishedAt: Date.now()
    });

    // 2. Process metadata state changes
    if (message.metadata?.stateChange) {
      await this.processStateChange(message);
    }
  }

  private async enqueueBuffered(message: GameMessage): Promise<void> {
    const queue = this.getOrCreateQueue(message.gameId);
    await queue.enqueue(message);
  }

  private getOrCreateQueue(gameId: string): BufferedQueue {
    if (!this.queues.has(gameId)) {
      this.queues.set(gameId, new BufferedQueue(gameId));
    }
    return this.queues.get(gameId)!;
  }
}

class BufferedQueue {
  private gameId: string;
  private queue: GameMessage[] = [];
  private processing: boolean = false;

  constructor(gameId: string) {
    this.gameId = gameId;
  }

  async enqueue(message: GameMessage): Promise<void> {
    this.queue.push(message);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const message = this.queue.shift()!;
      const now = Date.now();
      const duration = message.bufferDuration ?? DEFAULT_BUFFER_DURATION;

      // Publish message
      await db.insert(gameMessages).values({
        ...message,
        publishedAt: now,
        windowEndsAt: now + duration
      });

      // Process metadata state changes
      if (message.metadata?.stateChange) {
        await messageQueue.processStateChange(message);
      }

      // Wait for buffer window
      await new Promise(resolve => setTimeout(resolve, duration));
    }

    this.processing = false;
  }
}
```

## Game Flow Examples

### Example 1: Turn Submission Flow

```typescript
// User clicks submit in BotResponseModal
async function submitBotResponse() {
  // 1. API call creates buffered message
  await fetch('/api/game/{gameId}/turn/{turnId}/submit', {
    body: JSON.stringify({
      playerId,
      suggestion: updatedBotPrompt,
      responseText
    })
  });
}

// 2. Server creates buffered message
const message: GameMessage = {
  channel: 'buffered',
  type: 'bot_response',
  senderName: 'Bot Response',
  content: JSON.stringify({ name: botName, text: responseText }),
  bufferDuration: 5000,
  metadata: {
    stateChange: {
      action: 'submit_bot_response',
      payload: { playerId, turnId, responseText }
    }
  }
};

await messageQueue.publish(message);

// 3. Queue processes message after 5s window
// 4. processStateChange() runs:
await db.update(players)
  .set({ turnComplete: true })
  .where(eq(players.id, playerId));

// 5. Check if all players submitted
const allSubmitted = await checkAllPlayersComplete(gameId);
if (allSubmitted) {
  // Trigger turn processing (judging)
  await processTurn(gameId, turnId);
}
```

### Example 2: Turn Judging Flow (Multiple Buffered Messages)

```typescript
async function processTurn(gameId: string, turnId: number) {
  // 1. Get all responses
  const responses = await getResponsesForTurn(gameId, turnId);

  // 2. Start judging - publish instant message
  await messageQueue.publish({
    channel: 'instant',
    type: 'aligner_deliberation',
    senderName: 'The Aligner',
    content: 'The Aligner is deliberating...',
    metadata: {
      stateChange: {
        action: 'start_judging',
        payload: { turnId }
      }
    }
  });

  // 3. Stream aligner deliberation - buffered messages (2s each)
  for await (const sentence of alignerDeliberation) {
    await messageQueue.publish({
      channel: 'buffered',
      type: 'aligner_deliberation',
      senderName: 'The Aligner',
      content: sentence,
      bufferDuration: 2000
    });
  }

  // 4. Publish winner - buffered (7s)
  await messageQueue.publish({
    channel: 'buffered',
    type: 'round_winner',
    senderName: 'Round Winner',
    content: JSON.stringify({ name: winner.botName, score: winner.score }),
    bufferDuration: 7000,
    metadata: {
      stateChange: {
        action: 'award_point',
        payload: { playerId: winner.id, turnId }
      }
    }
  });

  // 5. Publish standings - buffered (5s)
  await messageQueue.publish({
    channel: 'buffered',
    type: 'standings',
    senderName: 'Standings',
    content: JSON.stringify(standings),
    bufferDuration: 5000,
    metadata: {
      stateChange: {
        action: 'complete_turn',
        payload: { turnId }
      }
    }
  });

  // 6. If game over, publish game_over - buffered (10s)
  if (winner.score >= pointsToWin) {
    await messageQueue.publish({
      channel: 'buffered',
      type: 'game_over',
      senderName: 'Game Over',
      content: JSON.stringify({ name: winner.botName, score: winner.score }),
      bufferDuration: 10000,
      metadata: {
        stateChange: {
          action: 'end_game',
          payload: { winnerId: winner.id }
        }
      }
    });
  }
}
```

### Example 3: Countdown Start (Instant)

```typescript
async function startCountdown(gameId: string, creatorId: string) {
  // Instant message - visible immediately
  await messageQueue.publish({
    channel: 'instant',
    type: 'countdown_started',
    content: 'The host started the countdown! Make sure your prompts are ready!',
    metadata: {
      stateChange: {
        action: 'start_countdown',
        payload: { creatorId }
      }
    }
  });

  // processStateChange() runs immediately:
  await db.update(games)
    .set({ countdownStartedAt: Date.now() })
    .where(eq(games.id, gameId));
}
```

## State Change Handlers

```typescript
class StateChangeProcessor {
  async processStateChange(message: GameMessage): Promise<void> {
    const { action, payload } = message.metadata!.stateChange!;

    switch (action) {
      case 'start_countdown':
        await this.handleStartCountdown(message.gameId, payload);
        break;

      case 'start_game':
        await this.handleStartGame(message.gameId, payload);
        break;

      case 'start_aligner_setup':
        await this.handleStartAlignerSetup(message.gameId);
        break;

      case 'complete_aligner_setup':
        await this.handleCompleteAlignerSetup(message.gameId);
        break;

      case 'start_turn':
        await this.handleStartTurn(message.gameId, payload);
        break;

      case 'submit_bot_response':
        await this.handleBotResponseSubmit(message.gameId, payload);
        break;

      case 'complete_turn':
        await this.handleCompleteTurn(message.gameId, payload);
        break;

      case 'award_point':
        await this.handleAwardPoint(message.gameId, payload);
        break;

      case 'end_game':
        await this.handleEndGame(message.gameId, payload);
        break;
    }
  }

  private async handleStartCountdown(gameId: string, payload: any) {
    await db.update(games)
      .set({ countdownStartedAt: Date.now() })
      .where(eq(games.id, gameId));
  }

  private async handleStartGame(gameId: string, payload: any) {
    await db.update(games)
      .set({ status: 'ALIGNER_SETUP' })
      .where(eq(games.id, gameId));
  }

  private async handleBotResponseSubmit(gameId: string, payload: any) {
    const { playerId, turnId, responseText } = payload;

    // Mark player as complete
    await db.update(players)
      .set({ turnComplete: true })
      .where(eq(players.id, playerId));

    // Store response
    await db.insert(turnResponses).values({
      gameId,
      turnId,
      playerId,
      responseText
    });

    // Check if all submitted
    const allPlayers = await db.select()
      .from(players)
      .where(and(eq(players.gameId, gameId), isNull(players.leftAt)));

    const allSubmitted = allPlayers.every(p => p.turnComplete);

    if (allSubmitted) {
      // Trigger turn processing
      await this.processTurn(gameId, turnId);
    }
  }

  private async handleAwardPoint(gameId: string, payload: any) {
    const { playerId } = payload;
    await db.update(players)
      .set({ score: sql`${players.score} + 1` })
      .where(eq(players.id, playerId));
  }

  private async handleCompleteTurn(gameId: string, payload: any) {
    // Advance to next turn
    await db.update(games)
      .set({
        turnStarted: false,
        turnPrompt: null,
        turnId: sql`${games.turnId} + 1`
      })
      .where(eq(games.id, gameId));
  }

  private async handleEndGame(gameId: string, payload: any) {
    await db.update(games)
      .set({ status: 'ENDED' })
      .where(eq(games.id, gameId));
  }
}
```

## Required Changes

### 1. Database Schema Updates

```typescript
// Add new columns to chatMessages table
export const gameMessages = sqliteTable('game_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  channel: text('channel', { enum: ['instant', 'buffered'] }).notNull().default('instant'),
  type: text('type', {
    enum: [
      'player_joined', 'player_left', 'countdown_started', 'game_started',
      'aligner_prompt_submitted', 'chat', 'turn_started', 'bot_response',
      'aligner_deliberation', 'round_winner', 'standings', 'game_over'
    ]
  }).notNull(),
  senderName: text('sender_name'),
  content: text('content').notNull(),
  metadata: text('metadata'), // JSON string
  bufferDuration: integer('buffer_duration'), // milliseconds
  publishedAt: integer('published_at'), // When made visible to clients
  windowEndsAt: integer('window_ends_at'), // publishedAt + bufferDuration
  createdAt: integer('created_at').notNull()
});

// Migration: rename chatMessages → gameMessages, add new columns
```

### 2. New Server Files

```
app/src/lib/server/
├── messages/
│   ├── queue.ts           # MessageQueue & BufferedQueue classes
│   ├── processor.ts       # StateChangeProcessor
│   ├── types.ts           # Message types & interfaces
│   └── service.ts         # Message CRUD operations
└── game/
    └── service.ts         # Update to use message queue
```

### 3. Updated API Routes

No changes needed to API route signatures, but internal implementations use message queue:

```typescript
// app/src/routes/api/game/[gameId]/turn/[turnId]/submit/+server.ts
export const POST: RequestHandler = async (event) => {
  const { playerId, suggestion, responseText } = await parseBody(event);

  // Instead of direct service call, publish message
  await messageQueue.publish({
    gameId: event.params.gameId,
    channel: 'buffered',
    type: 'bot_response',
    senderName: 'Bot Response',
    content: JSON.stringify({ playerId, responseText }),
    bufferDuration: 5000,
    metadata: {
      stateChange: {
        action: 'submit_bot_response',
        payload: { playerId, turnId, suggestion, responseText }
      }
    }
  });

  return json({ success: true });
};
```

### 4. Client Polling Changes

```typescript
// Current: Poll /api/game/{gameId}/chat?after={id}
// New: Same endpoint, but now includes channel & publishedAt

async function fetchMessages() {
  const url = `/api/game/${gameId}/messages?after=${lastMessageId}`;
  const response = await fetch(url);
  const data = await response.json();

  // Filter: only show messages where publishedAt !== null
  const visibleMessages = data.messages.filter(m => m.publishedAt !== null);
  messages = [...messages, ...visibleMessages];
}
```

### 5. Message API Endpoint

```typescript
// app/src/routes/api/game/[gameId]/messages/+server.ts
export const GET: RequestHandler = async (event) => {
  const gameId = event.params.gameId;
  const afterId = Number(event.url.searchParams.get('after') ?? 0);

  // Only return messages that have been published (publishedAt !== null)
  const messages = await db.select()
    .from(gameMessages)
    .where(
      and(
        eq(gameMessages.gameId, gameId),
        gt(gameMessages.id, afterId),
        isNotNull(gameMessages.publishedAt)
      )
    )
    .orderBy(gameMessages.id);

  return json({ messages });
};
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. Create message queue system (`queue.ts`, `processor.ts`, `types.ts`)
2. Update database schema (migration)
3. Implement basic instant message flow
4. Update chat polling to use new messages table

### Phase 2: Buffered Messages (Week 2)
1. Implement BufferedQueue with time windows
2. Add state change processor
3. Migrate countdown/game start to message system
4. Test buffered message sequencing

### Phase 3: Turn Flow Migration (Week 3)
1. Migrate turn start to message system
2. Migrate bot response submission
3. Migrate aligner judging with buffered sentences
4. Migrate round winner / standings

### Phase 4: Testing & Polish (Week 4)
1. E2E tests for message flow
2. Handle edge cases (player leaves during buffer)
3. Performance testing (long queues)
4. Client UI polish (loading states)

## Edge Cases & Considerations

### 1. Player Leaves During Buffer Window
- Buffered messages continue to publish
- Instant "player left" message interleaves
- State changes still process normally

### 2. Game Reset/Restart
- Clear buffered queue for game
- Cancel any pending timeouts
- Maintain message history in DB

### 3. Server Restart
- Buffered queues are in-memory → need recovery mechanism
- On restart, check for unpublished buffered messages
- Resume publishing with adjusted timings

### 4. Buffer Duration Configuration
- Per-game settings for buffer durations
- Admin override for testing (instant mode)
- Dynamic adjustment based on message type

### 5. Message Ordering
- Instant messages use `publishedAt` for ordering
- Buffered messages maintain creation order within queue
- Client sorts by `publishedAt` ASC

### 6. Rate Limiting
- Current rate limits apply to message creation
- Buffered messages don't bypass rate limits
- Queue size limits per game (e.g., max 100 pending)

## Benefits of New System

1. **Dramatic Pacing**: Buffered messages create natural drama and suspense
2. **Declarative Flow**: State changes driven by messages, easier to reason about
3. **Auditability**: Full message log shows exact game progression
4. **Flexibility**: Easy to adjust timing without changing game logic
5. **Testability**: Mock message queue for deterministic tests
6. **Replay**: Could replay entire game from message log

## Migration Strategy

### Backward Compatibility
- Keep `chatMessages` table during transition
- Run both systems in parallel
- Feature flag: `USE_MESSAGE_QUEUE=1`
- Gradual migration: instant messages first, then buffered

### Rollback Plan
- Feature flag can disable new system
- Falls back to direct DB writes
- No data loss (messages still in DB)
