ALTER TABLE `games` ADD `max_turns` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `bot_prompt_changes` integer DEFAULT 1 NOT NULL;