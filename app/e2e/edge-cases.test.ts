import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';

async function fillBotSetupAndEnter(page: Page, botName: string) {
	await expect(page.locator('#bot-name-input')).toBeVisible({ timeout: 10000 });
	await page.locator('#bot-name-input').fill(botName);
	await page.locator('#bot-prompt-input').fill('Be chaotic neutral.');
	await page.getByRole('button', { name: 'Enter', exact: true }).click();
	await expect(page.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 20000 });
}

test('invalid game id redirects home', async ({ page }) => {
	await page.goto(`${BASE_URL}/game?game_id=not-a-real-game-id`);
	await expect(page).toHaveURL(`${BASE_URL}/`);
	await expect(page.getByRole('heading', { name: 'Bots Against Alignment' })).toBeVisible();
});

test('join modal rejects invalid game id', async ({ page }) => {
	await page.goto(BASE_URL);
	await page.getByRole('button', { name: 'Join Game' }).click();
	await page.getByPlaceholder('45210b0a-12cc-4be9-9bd3-69896b58dfad').fill('not-a-uuid');
	await page.locator('.modal').getByRole('button', { name: 'Join Game' }).click();
	await expect(page.getByText('Invalid Game ID. Please try again.')).toBeVisible();
});

test('non-creator cannot start the game', async ({ browser }) => {
	const creatorContext = await browser.newContext();
	const opponentContext = await browser.newContext();
	const creator = await creatorContext.newPage();
	const opponent = await opponentContext.newPage();

	try {
		// Creator flow: homepage -> New Game -> BotSetupModal -> Enter -> Lobby
		await creator.goto(BASE_URL);
		await creator.getByRole('button', { name: 'New Game' }).click();
		await fillBotSetupAndEnter(creator, 'Creator Bot');

		// Get game ID from lobby
		const gameText = await creator
			.locator('#header')
			.getByRole('button', { name: /Game #/ })
			.textContent();
		const match = gameText?.match(/Game #\s*([0-9a-fA-F-]+)/);
		if (!match) throw new Error('Game ID not found');
		const gameId = match[1];

		// Opponent flow: homepage -> Join Game modal -> enter game ID -> BotSetupModal -> Enter -> Lobby
		await opponent.goto(BASE_URL);
		await opponent.getByRole('button', { name: 'Join Game' }).click();
		await opponent.getByPlaceholder('45210b0a-12cc-4be9-9bd3-69896b58dfad').fill(gameId);
		await opponent.locator('.modal').getByRole('button', { name: 'Join Game' }).click();
		await fillBotSetupAndEnter(opponent, 'Opponent Bot');

		await expect(opponent.getByRole('button', { name: 'Start Game' })).toHaveCount(0);
		await expect(creator.getByRole('button', { name: 'Start Game' })).toBeVisible();
	} finally {
		await creatorContext.close();
		await opponentContext.close();
	}
});
