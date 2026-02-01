import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';

async function joinGame(page: Page, botName: string) {
	await expect(page.getByRole('heading', { name: 'Bot Name' })).toBeVisible();
	await page.locator('#bot-name-input').fill(botName);
	await page.locator('#aligner-input').fill('Pick the funniest response.');
	await page.locator('#bot-prompt-input').fill('Be chaotic neutral.');
	await page.getByRole('button', { name: 'Join' }).click();
	await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
}

test('gun chat syncs across players through the core game flow', async ({ browser }) => {
	const creatorContext = await browser.newContext();
	const opponentContext = await browser.newContext();
	const creator = await creatorContext.newPage();
	const opponent = await opponentContext.newPage();

	try {
		await creator.goto(BASE_URL);
		await creator.getByRole('button', { name: 'New Game' }).click();
		await joinGame(creator, 'Alice');

		const gameText = await creator.getByText(/Game #/).textContent();
		const match = gameText?.match(/Game #\s*([0-9a-fA-F-]+)/);
		if (!match) throw new Error('Game ID not found');
		const gameId = match[1];

		await opponent.goto(`${BASE_URL}/game?game_id=${gameId}`);
		await joinGame(opponent, 'Bob');

		await expect(
			creator.locator('.message.status', { hasText: 'Bob' }).last()
		).toContainText('joined the game', { timeout: 15000 });

		await creator.getByRole('button', { name: 'Start Game' }).click();

		await expect(creator.getByText('Game started')).toBeVisible({ timeout: 15000 });
		await expect(opponent.getByText('Game started')).toBeVisible({ timeout: 15000 });

		const chatMessage = `hello-from-alice-${Date.now()}`;
		await creator.getByPlaceholder('Type your message...').fill(chatMessage);
		await creator.getByPlaceholder('Type your message...').press('Enter');

		await expect(creator.getByText(chatMessage)).toBeVisible({ timeout: 15000 });
		await expect(opponent.getByText(chatMessage)).toBeVisible({ timeout: 15000 });
		await expect(opponent.locator('.message-text', { hasText: chatMessage })).toHaveCount(1);

		await expect(creator.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible();
		await expect(opponent.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible();

		await creator.getByRole('button', { name: /Tell Bot To Respond/i }).click();
		await expect(
			opponent.locator('.message.status', { hasText: 'Alice' }).last()
		).toContainText('Submitted response', { timeout: 15000 });

		await opponent.getByRole('button', { name: /Tell Bot To Respond/i }).click();
		await expect(creator.locator('.message.status', { hasText: 'Bob' }).last()).toContainText(
			'Submitted response',
			{ timeout: 15000 }
		);

		await expect(creator.getByRole('button', { name: /Next Turn/i })).toBeVisible({ timeout: 20000 });
		await expect(opponent.getByRole('button', { name: /Next Turn/i })).toBeVisible({ timeout: 20000 });

		await creator.getByRole('button', { name: /Next Turn/i }).click();
		await opponent.getByRole('button', { name: /Next Turn/i }).click();

		await expect(creator.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible({
			timeout: 20000
		});
		await expect(opponent.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible({
			timeout: 20000
		});

		const chatMessage2 = `hello-from-bob-${Date.now()}`;
		await opponent.getByPlaceholder('Type your message...').fill(chatMessage2);
		await opponent.getByPlaceholder('Type your message...').press('Enter');

		await expect(opponent.getByText(chatMessage2)).toBeVisible({ timeout: 15000 });
		await expect(creator.getByText(chatMessage2)).toBeVisible({ timeout: 15000 });
		await expect(creator.locator('.message-text', { hasText: chatMessage2 })).toHaveCount(1);
	} finally {
		await creatorContext.close();
		await opponentContext.close();
	}
});
