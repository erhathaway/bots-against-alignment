# Bots Against Alignment -- Rules

## Overview

Bots Against Alignment is a multiplayer party game (think Cards Against Humanity, but with AI). Each player builds an AI "bot" with a custom personality, then competes to produce the response that best satisfies a shared AI judge called **the Aligner**. The twist: every player secretly contributes a rule to the Aligner's judging criteria, so nobody knows exactly how responses will be evaluated.

An LLM (GPT-3.5) acts as both the bots and the judge. Players don't write responses directly -- they write *instructions* that shape how their bot responds.

---

## Concepts

**Bot** -- Each player's AI persona. You give it a name and a prompt that controls its personality and response style (e.g., "I will respond with conspiracy theories" or "I will respond in Shakespearean English").

**Bot Prompt** -- The instruction that tells your bot *how* to respond. This is the main thing you control during the game. You start with one, and you get 2 chances to change it over the entire game.

**Aligner** -- The AI judge. Before the game starts, every player secretly writes one judging rule (an "aligner instruction"). All of these rules get shuffled together and combined into a single judging prompt. The Aligner uses this combined prompt to pick a winner each turn.

**Turn Prompt** -- A fill-in-the-blank prompt card drawn each turn (e.g., `"_______: good to the last drop."` or `"But before I kill you, Mr. Bond, I must show you _______."`). Every bot responds to this prompt, filtered through its bot prompt.

---

## Setup

### Creating or Joining

1. One player creates a new game and gets a shareable link.
2. Other players open the link and join the game.

### Pre-Game Configuration

Before the game starts, every player fills in three things:

| Field | What it does | Limits |
|---|---|---|
| **Bot Name** | Your bot's display name | Max 30 characters |
| **Aligner Instruction** | Your secret judging rule contributed to the shared Aligner (e.g., "The most absurd answer wins") | No hard limit |
| **Bot Prompt** | Your bot's personality/style instruction (e.g., "I will respond with dad jokes") | Max 281 characters |

All three fields can be randomized via a dice button (the backend generates suggestions using GPT or pulls from a pre-built pool).

Once all fields are filled in, the player clicks **Join**.

### Lobby & Starting

- After joining, players wait in a lobby.
- The game creator sees a **Start Game** button. Other players see "Waiting for creator to start game."
- The creator shares the game link with friends, then clicks Start.

### Auto-Fill Bots

The game targets 4 players. If fewer than 4 human players have joined when the creator starts the game, AI-controlled bots are automatically added to fill the gap. These auto-bots get random names, prompts, and aligner instructions.

### Aligner Compilation

When the game starts, all players' aligner instructions are collected, shuffled into a random order, and combined into a single judging prompt. This is the Aligner's "alignment goal" for the rest of the game.

---

## Turn Flow

Each turn has three phases:

### Phase 1: Aligner Says

A random **turn prompt** (fill-in-the-blank card) is drawn and shown to all players.

Each player sees:
- The turn prompt card
- Their current bot prompt (editable -- if they have prompt changes remaining)

The player can optionally **edit their bot prompt** before submitting. This costs 1 of their 2 remaining prompt changes. If the prompt field is left unchanged (or empty), no change is deducted.

When ready, the player clicks **"Tell Bot To Respond To Aligner"**. This:
1. Sends their (possibly updated) bot prompt + the turn prompt to GPT.
2. GPT generates a short response (under 5 words) in the style of the bot prompt.
3. The player's turn is marked as submitted.

If the creator submits, all auto-bots also generate their responses at the same time.

Players wait until everyone has submitted.

### Phase 2: Judging

Once all players (and auto-bots) have submitted, the turn moves to the **Turn Finale** screen.

The creator triggers judging by clicking **"Next Turn"**. Behind the scenes:
1. All bot responses are collected and numbered.
2. The combined Aligner prompt + the turn prompt + all numbered responses are sent to GPT.
3. GPT picks the response that best matches the alignment goal.
4. If GPT's answer doesn't clearly match any option, a random bot wins.

### Phase 3: Results

The winning bot gets **+1 point**. The game checks whether any bot has reached **10 points**:

- **No** -- a new turn begins (back to Phase 1 with a fresh turn prompt).
- **Yes** -- the game ends.

---

## Scoring & Winning

- Each turn, the winning bot earns **1 point**.
- First bot to reach **10 points** wins the game.
- The game finale screen appears for all players when someone hits 10.

---

## Prompt Changes

- Each player starts with **2 prompt changes** for the entire game (not per turn).
- A prompt change lets you rewrite your bot prompt before submitting a turn.
- Once you've used both changes, your bot prompt is locked for the rest of the game.
- Choose wisely -- if early turns reveal the Aligner favors a certain style, you may want to adapt.

---

## Chat

A real-time chat sidebar runs alongside the game (powered by GunJS). Players can chat freely during all phases. System messages are posted when the game starts and when players submit responses.

---

## Summary of a Full Game

```
1. Create game / share link
2. All players fill in: bot name, aligner instruction, bot prompt
3. All players join
4. Creator starts game (auto-bots fill empty seats up to 4)
5. Aligner instructions are shuffled and combined
   ┌──────────────────────────────────────────────┐
   │  TURN LOOP (repeats until someone hits 10):  │
   │                                               │
   │  a. Random turn prompt card is drawn          │
   │  b. Players optionally tweak bot prompt       │
   │  c. Players click "Tell Bot To Respond"       │
   │  d. Wait for all players to submit            │
   │  e. Aligner judges all responses              │
   │  f. Winner gets +1 point                      │
   │  g. Check for 10-point winner                 │
   └──────────────────────────────────────────────┘
6. Game over -- winner declared
```
