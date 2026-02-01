import { expect, test } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';

test('can create, join, start, and advance a turn', async ({ page }) => {
	await page.goto(BASE_URL);
	const requests: string[] = [];
	page.on('request', (request) => {
		const url = request.url();
		if (url.includes('/api/')) {
			requests.push(url);
		}
	});

	await page.getByRole('button', { name: 'New Game' }).click();

	await expect(page.getByRole('heading', { name: 'Bot Name' })).toBeVisible();
	await page.locator('#bot-name-input').fill('E2E Bot');
	await page.locator('#aligner-input').fill('Pick the funniest response.');
	await page.locator('#bot-prompt-input').fill('Be chaotic neutral.');
	await page.getByRole('button', { name: 'Join' }).click();

	await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
	await page.getByRole('button', { name: 'Start Game' }).click();

	await page.waitForResponse((response) => response.url().includes('/turn/ensure'));
	await expect(page.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible();
	await page.getByRole('button', { name: /Tell Bot To Respond/i }).click();

	await expect(page.getByRole('button', { name: /Next Turn/i })).toBeVisible();
	await page.getByRole('button', { name: /Next Turn/i }).click();

	await expect(page.getByText('Aligner:')).toBeVisible();

	expect(requests.some((url) => url.includes('/turn/ensure'))).toBeTruthy();
	expect(requests.some((url) => url.includes('/turn/') && url.includes('/submit'))).toBeTruthy();
	expect(requests.some((url) => url.includes('/turn/') && url.includes('/finale'))).toBeTruthy();
	expect(requests.some((url) => url.includes('/turn/') && url.includes('/process'))).toBeTruthy();
});

test('join_game sends prompts safely', async ({ page }) => {
	await page.goto(`${BASE_URL}/game`);

	await expect(page.getByRole('heading', { name: 'Bot Name' })).toBeVisible();

	const botName = 'A&B Bot';
	const alignerPrompt = 'pick A&B = winners';
	const botPrompt = 'say A&B? yes=maybe';

	await page.locator('#bot-name-input').fill(botName);
	await page.locator('#aligner-input').fill(alignerPrompt);
	await page.locator('#bot-prompt-input').fill(botPrompt);

	const joinRequestPromise = page.waitForRequest((request) =>
		request.url().includes('/api/game/') && request.url().includes('/join')
	);
	await page.getByRole('button', { name: 'Join' }).click();

	const joinRequest = await joinRequestPromise;
	const payload = JSON.parse(joinRequest.postData() ?? '{}');

	expect(payload.botName).toBe(botName);
	expect(payload.alignerPrompt).toBe(alignerPrompt);
	expect(payload.botPrompt).toBe(botPrompt);
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
		await creator.getByRole('button', { name: 'Join' }).click();

		const gameText = await creator.getByText(/Game #/).textContent();
		const match = gameText?.match(/Game #\s*([0-9a-fA-F-]+)/);
		if (!match) throw new Error('Game ID not found');
		const gameId = match[1];

		await opponent.goto(`${BASE_URL}/game?game_id=${gameId}`);
		await expect(opponent.getByRole('heading', { name: 'Bot Name' })).toBeVisible();
		await opponent.locator('#bot-name-input').fill('Opponent Bot');
		await opponent.locator('#aligner-input').fill('Pick the funniest response.');
		await opponent.locator('#bot-prompt-input').fill('Be chaotic neutral.');
		await opponent.getByRole('button', { name: 'Join' }).click();

		await expect(creator.getByRole('button', { name: 'Start Game' })).toBeVisible();
		await creator.getByRole('button', { name: 'Start Game' }).click();

		await expect(creator.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible();
		await expect(opponent.getByRole('button', { name: /Tell Bot To Respond/i })).toBeVisible();

		await creator.getByRole('button', { name: /Tell Bot To Respond/i }).click();
		await opponent.getByRole('button', { name: /Tell Bot To Respond/i }).click();

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
	} finally {
		await creatorContext.close();
		await opponentContext.close();
	}
});
