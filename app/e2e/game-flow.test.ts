import { expect, test } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';

test.describe.configure({ timeout: 60_000 });

test('can create, join, start, and advance a turn', async ({ page }) => {
	await page.goto(BASE_URL);

	await page.getByRole('button', { name: 'New Game' }).click();

	await expect(page.getByRole('heading', { name: 'Bot Name' })).toBeVisible();
	await page.locator('#bot-name-input').fill('E2E Bot');
	await page.locator('#aligner-input').fill('Pick the funniest response.');
	await page.locator('#bot-prompt-input').fill('Be chaotic neutral.');
	await page.getByRole('button', { name: 'Join', exact: true }).click();

	await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
	await page.getByRole('button', { name: 'Start Game' }).click();
	await expect(page.getByRole('button', { name: 'Start Now' })).toBeVisible();
	await page.getByRole('button', { name: 'Start Now' }).click();

	await expect(page.getByText('Turn Prompt')).toBeVisible({ timeout: 20000 });
	await expect(page.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible({
		timeout: 20000
	});
	await page.getByRole('button', { name: /Tell Bot To Respond/i }).click();
	await expect(page.getByText(/Response submitted/i)).toBeVisible({ timeout: 20000 });

	await expect(page.getByText('Round Winner')).toBeVisible({ timeout: 30000 });

	await expect(page.getByText('Turn Prompt')).toHaveCount(2, { timeout: 30000 });
	await expect(page.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible();
});

test('join_game preserves prompt values', async ({ page }) => {
	await page.goto(`${BASE_URL}/game`);

	await expect(page.getByRole('heading', { name: 'Bot Name' })).toBeVisible();

	const botName = 'A&B Bot';
	const alignerPrompt = 'pick A&B = winners';
	const botPrompt = 'say A&B? yes=maybe';

	await page.locator('#bot-name-input').fill(botName);
	await page.locator('#aligner-input').fill(alignerPrompt);
	await page.locator('#bot-prompt-input').fill(botPrompt);

	await page.getByRole('button', { name: 'Join', exact: true }).click();

	await expect(page.locator('.player-chip', { hasText: botName })).toBeVisible({ timeout: 20000 });
	await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
	await page.getByRole('button', { name: 'Start Game' }).click();
	await expect(page.getByRole('button', { name: 'Start Now' })).toBeVisible();
	await page.getByRole('button', { name: 'Start Now' }).click();

	await expect(page.getByText('Turn Prompt')).toBeVisible({ timeout: 20000 });
	await expect(page.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible({
		timeout: 20000
	});
	await expect(page.locator('#bot-card').getByRole('textbox', { name: 'Bot Prompt' })).toHaveValue(
		botPrompt
	);
});

test('two-player game flow works end-to-end', async ({ browser }) => {
	const creatorContext = await browser.newContext();
	const opponentContext = await browser.newContext();
	const creator = await creatorContext.newPage();
	const opponent = await opponentContext.newPage();

	try {
		await creator.goto(BASE_URL);
		await creator.getByRole('button', { name: 'New Game' }).click();

		await expect(creator.getByRole('heading', { name: 'Bot Name' })).toBeVisible();
		await creator.locator('#bot-name-input').fill('Creator Bot');
		await creator.locator('#aligner-input').fill('Pick the funniest response.');
		await creator.locator('#bot-prompt-input').fill('Be chaotic neutral.');
		await creator.getByRole('button', { name: 'Join', exact: true }).click();

		const gameText = await creator
			.locator('#header')
			.getByRole('button', { name: /Game #/ })
			.textContent();
		const match = gameText?.match(/Game #\s*([0-9a-fA-F-]+)/);
		if (!match) throw new Error('Game ID not found');
		const gameId = match[1];

		await opponent.goto(`${BASE_URL}/game?game_id=${gameId}`);
		await expect(opponent.getByRole('heading', { name: 'Bot Name' })).toBeVisible();
		await opponent.locator('#bot-name-input').fill('Opponent Bot');
		await opponent.locator('#aligner-input').fill('Pick the funniest response.');
		await opponent.locator('#bot-prompt-input').fill('Be chaotic neutral.');
		await opponent.getByRole('button', { name: 'Join', exact: true }).click();

		await expect(creator.getByRole('button', { name: 'Start Game' })).toBeVisible();
		await creator.getByRole('button', { name: 'Start Game' }).click();
		await expect(creator.getByRole('button', { name: 'Start Now' })).toBeVisible();
		await creator.getByRole('button', { name: 'Start Now' }).click();

		await expect(creator.getByText('Turn Prompt')).toBeVisible({ timeout: 20000 });
		await expect(opponent.getByText('Turn Prompt')).toBeVisible({ timeout: 20000 });
		await expect(creator.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible({
			timeout: 20000
		});
		await expect(opponent.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible({
			timeout: 20000
		});

		await creator.getByRole('button', { name: /Tell Bot To Respond/i }).click();
		await opponent.getByRole('button', { name: /Tell Bot To Respond/i }).click();

		await expect(creator.getByText(/Response submitted/i)).toBeVisible({ timeout: 20000 });
		await expect(opponent.getByText(/Response submitted/i)).toBeVisible({ timeout: 20000 });

		await expect(creator.getByText('Round Winner')).toBeVisible({ timeout: 30000 });
		await expect(opponent.getByText('Round Winner')).toBeVisible({ timeout: 30000 });

		await expect(creator.getByText('Turn Prompt')).toHaveCount(2, { timeout: 30000 });
		await expect(opponent.getByText('Turn Prompt')).toHaveCount(2, { timeout: 30000 });
		await expect(creator.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible({
			timeout: 20000
		});
		await expect(opponent.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible({
			timeout: 20000
		});
	} finally {
		await creatorContext.close();
		await opponentContext.close();
	}
});
