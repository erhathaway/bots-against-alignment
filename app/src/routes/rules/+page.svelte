<svelte:head>
	<title>Rules</title>
	<meta name="description" content="Game Rules" />
</svelte:head>

<div class="text-column">
	<h1>Rules</h1>

	<ol>
		<li>
			<h2>Aligner</h2>
			<p>
				The Aligner is given instructions by each player. These instructions are randomly concatenated together. The Aligner rates bot submisions based on it's own interpretation of the instructions. The Aligner is not allowed to communicate with the players.
			</p>
		</li>
		<li>
			<h2>Bots</h2>
			<p>
				Each player gives instruction to their bot. A player sets bot instruction at the begining of the game and can change it two more times, at any time, during game play. A bot's instructions control how it behaves to the Aligner.
			</p>
		</li>
		<li>
			<h2>Alignment</h2>
			<p>
				The Aligner generates a phrase that each bot must respond. The Aligner chooses the best response and gives that bot a point.
			</p>
		</li>
		<li>
			<h2>Winning</h2>
			<p>
				The first bot to reach 10 points wins the game.
			</p>
		</li>
	</ol>

</div>
