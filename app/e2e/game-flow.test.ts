import { expect, test } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';

test.describe.configure({ timeout: 60_000 });

test('can create, join, start, and advance a turn', async ({ page }) => {
	await page.goto(BASE_URL);

	await page.getByRole('button', { name: 'New Game' }).click();

	// BotSetupModal appears on homepage
	await expect(page.locator('#bot-name-input')).toBeVisible({ timeout: 10000 });
	await page.locator('#bot-name-input').fill('E2E Bot');
	await page.locator('#bot-prompt-input').fill('Be chaotic neutral.');
	await page.getByRole('button', { name: 'Enter', exact: true }).click();

	// Now in Lobby
	await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible({ timeout: 20000 });
	await page.getByRole('button', { name: 'Start Game' }).click();
	await expect(page.getByRole('button', { name: 'Start Now' })).toBeVisible();
	await page.getByRole('button', { name: 'Start Now' }).click();

	// AlignerSetup phase - new AlignerPromptModal
	await expect(page.locator('#aligner-prompt')).toBeVisible({ timeout: 10000 });
	await page.locator('#aligner-prompt').fill('Pick the funniest response.');
	await page.getByRole('button', { name: 'Submit', exact: true }).click();

	// Gameplay begins - new BotResponseModal
	await expect(page.getByRole('button', { name: 'Respond' })).toBeVisible({ timeout: 20000 });
	await page.getByRole('button', { name: 'Respond' }).click();
	await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible({ timeout: 20000 });
	await page.getByRole('button', { name: 'Submit' }).click();
	// Modal should close after submission
	await expect(page.getByRole('button', { name: 'Respond' })).not.toBeVisible({ timeout: 10000 });

	await expect(page.getByText('Round Winner')).toBeVisible({ timeout: 30000 });

	// Next turn should show the modal again
	await expect(page.getByRole('button', { name: 'Respond' })).toBeVisible({ timeout: 30000 });
});

test('join_game preserves prompt values', async ({ page }) => {
	await page.goto(BASE_URL);

	await page.getByRole('button', { name: 'New Game' }).click();

	// BotSetupModal appears on homepage
	await expect(page.locator('#bot-name-input')).toBeVisible({ timeout: 10000 });

	const botName = 'A&B Bot';
	const botPrompt = 'say A&B? yes=maybe';

	await page.locator('#bot-name-input').fill(botName);
	await page.locator('#bot-prompt-input').fill(botPrompt);

	await page.getByRole('button', { name: 'Enter', exact: true }).click();

	// In Lobby — start game
	await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible({ timeout: 20000 });
	await page.getByRole('button', { name: 'Start Game' }).click();
	await expect(page.getByRole('button', { name: 'Start Now' })).toBeVisible();
	await page.getByRole('button', { name: 'Start Now' }).click();

	// AlignerSetup phase - new AlignerPromptModal
	await expect(page.locator('#aligner-prompt')).toBeVisible({ timeout: 10000 });
	await page.locator('#aligner-prompt').fill('pick A&B = winners');
	await page.getByRole('button', { name: 'Submit', exact: true }).click();

	// Gameplay - new BotResponseModal shows bot prompt textarea
	await expect(page.getByRole('button', { name: 'Respond' })).toBeVisible({ timeout: 20000 });
	// Check that the bot prompt textarea has the expected value
	await expect(page.locator('textarea').nth(0)).toHaveValue(botPrompt);
});

test('two-player game flow works end-to-end', async ({ browser }) => {
	const creatorContext = await browser.newContext();
	const opponentContext = await browser.newContext();
	const creator = await creatorContext.newPage();
	const opponent = await opponentContext.newPage();

	try {
		// Creator creates game
		await creator.goto(BASE_URL);
		await creator.getByRole('button', { name: 'New Game' }).click();

		await expect(creator.locator('#bot-name-input')).toBeVisible({ timeout: 10000 });
		await creator.locator('#bot-name-input').fill('Creator Bot');
		await creator.locator('#bot-prompt-input').fill('Be chaotic neutral.');
		await creator.getByRole('button', { name: 'Enter', exact: true }).click();

		// Get game ID from Lobby
		await expect(creator.getByRole('button', { name: 'Start Game' })).toBeVisible({
			timeout: 20000
		});
		const gameText = await creator
			.locator('#header')
			.getByRole('button', { name: /Game #/ })
			.textContent();
		const match = gameText?.match(/Game #\s*([0-9a-fA-F-]+)/);
		if (!match) throw new Error('Game ID not found');
		const gameId = match[1];

		// Opponent joins via Join Game modal
		await opponent.goto(BASE_URL);
		await opponent.getByRole('button', { name: 'Join Game' }).click();
		await opponent.getByPlaceholder('45210b0a-12cc-4be9-9bd3-69896b58dfad').fill(gameId);
		await opponent.locator('.modal').getByRole('button', { name: 'Join Game' }).click();

		// Opponent fills BotSetupModal
		await expect(opponent.locator('#bot-name-input')).toBeVisible({ timeout: 10000 });
		await opponent.locator('#bot-name-input').fill('Opponent Bot');
		await opponent.locator('#bot-prompt-input').fill('Be chaotic neutral.');
		await opponent.getByRole('button', { name: 'Enter', exact: true }).click();

		// Both in Lobby — creator starts game
		await expect(creator.getByRole('button', { name: 'Start Game' })).toBeVisible();
		await creator.getByRole('button', { name: 'Start Game' }).click();
		await expect(creator.getByRole('button', { name: 'Start Now' })).toBeVisible();
		await creator.getByRole('button', { name: 'Start Now' }).click();

		// Both see AlignerSetup - new AlignerPromptModal
		await expect(creator.locator('#aligner-prompt')).toBeVisible({ timeout: 10000 });
		await expect(opponent.locator('#aligner-prompt')).toBeVisible({ timeout: 10000 });

		await creator.locator('#aligner-prompt').fill('Pick the funniest response.');
		await creator.getByRole('button', { name: 'Submit', exact: true }).click();

		await opponent.locator('#aligner-prompt').fill('Pick the funniest response.');
		await opponent.getByRole('button', { name: 'Submit', exact: true }).click();

		// Gameplay begins for both - new BotResponseModal
		await expect(creator.getByRole('button', { name: 'Respond' })).toBeVisible({
			timeout: 20000
		});
		await expect(opponent.getByRole('button', { name: 'Respond' })).toBeVisible({
			timeout: 20000
		});

		await creator.getByRole('button', { name: 'Respond' }).click();
		await expect(creator.getByRole('button', { name: 'Submit' })).toBeVisible({ timeout: 20000 });
		await creator.getByRole('button', { name: 'Submit' }).click();

		await opponent.getByRole('button', { name: 'Respond' }).click();
		await expect(opponent.getByRole('button', { name: 'Submit' })).toBeVisible({
			timeout: 20000
		});
		await opponent.getByRole('button', { name: 'Submit' }).click();

		// Modals should close after submission
		await expect(creator.getByRole('button', { name: 'Respond' })).not.toBeVisible({
			timeout: 10000
		});
		await expect(opponent.getByRole('button', { name: 'Respond' })).not.toBeVisible({
			timeout: 10000
		});

		await expect(creator.getByText('Round Winner')).toBeVisible({ timeout: 30000 });
		await expect(opponent.getByText('Round Winner')).toBeVisible({ timeout: 30000 });

		// Next turn should show the modal again for both
		await expect(creator.getByRole('button', { name: 'Respond' })).toBeVisible({ timeout: 30000 });
		await expect(opponent.getByRole('button', { name: 'Respond' })).toBeVisible({
			timeout: 30000
		});
	} finally {
		await creatorContext.close();
		await opponentContext.close();
	}
});
