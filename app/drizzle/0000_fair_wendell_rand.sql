CREATE TABLE `aligner_prompts` (
	`game_id` text NOT NULL,
	`player_id` text NOT NULL,
	`prompt` text NOT NULL,
	PRIMARY KEY(`game_id`, `player_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` text NOT NULL,
	`channel` text DEFAULT 'instant' NOT NULL,
	`type` text NOT NULL,
	`sender_name` text,
	`content` text NOT NULL,
	`metadata` text,
	`buffer_duration` integer,
	`published_at` integer,
	`window_ends_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`creator_player_id` text,
	`status` text NOT NULL,
	`points_to_win` integer DEFAULT 10 NOT NULL,
	`aligner_type` text DEFAULT 'USER_ROUND_ROBIN' NOT NULL,
	`max_auto_players` integer DEFAULT 0 NOT NULL,
	`max_turns` integer DEFAULT 2 NOT NULL,
	`bot_prompt_changes` integer DEFAULT 1 NOT NULL,
	`turn_id` integer DEFAULT 1 NOT NULL,
	`turn_started` integer DEFAULT false NOT NULL,
	`turn_prompt` text,
	`aligner_prompt_full` text DEFAULT '' NOT NULL,
	`countdown_started_at` integer,
	`next_game_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`bot_name` text NOT NULL,
	`bot_prompt` text NOT NULL,
	`submitted_bot_prompt` text NOT NULL,
	`prompts_remaining` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`is_auto` integer DEFAULT false NOT NULL,
	`turn_complete` integer DEFAULT false NOT NULL,
	`left_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`window_start` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `turn_responses` (
	`game_id` text NOT NULL,
	`turn_id` integer NOT NULL,
	`player_id` text NOT NULL,
	`response_text` text NOT NULL,
	PRIMARY KEY(`game_id`, `turn_id`, `player_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `turns` (
	`game_id` text NOT NULL,
	`turn_id` integer NOT NULL,
	`prompt` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`winner_player_id` text,
	`processed_at` integer,
	PRIMARY KEY(`game_id`, `turn_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winner_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE set null
);
