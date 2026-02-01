<script lang="ts">
	type Props = {
		title?: string;
		subtitle?: string;
	};

	let { title = 'Bots Against Alignment', subtitle = 'A turn-based multiplayer game' }: Props =
		$props();
</script>

<div class="text-container">
	<h1>{title}</h1>
	<h2>{subtitle}</h2>
</div>

<style>
	.text-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font:
			1.5rem/1.5 'Roboto',
			sans-serif;
		height: 100%;
		padding: 100px;
	}

	h1 {
		font-size: 120px;
		font-weight: bold;
		letter-spacing: 15px;
		color: rgb(123, 255, 0);
		text-shadow: 4px 4px 5px rgba(67, 164, 25, 0.3);
		margin: 0;
		font-family: 'Bebas Neue', cursive;
		-webkit-text-stroke-width: 2px;
		-webkit-text-stroke-color: rgba(0, 0, 0, 0.6);
	}

	h2 {
		font-size: 1.7rem;
		text-align: center;
		font-weight: 100;
		letter-spacing: 2px;
		line-height: 2.3rem;
		color: #000000;
		margin: 2rem;
	}

	@media (max-width: 1300px) {
		h1 {
			font-size: 110px;
			letter-spacing: 0px;
			line-height: 100px;
		}
	}

	@media (max-width: 950px) {
		h1 {
			font-size: 80px;
			letter-spacing: 0px;
			line-height: 70px;
		}

		h2 {
			font-size: 1.5rem;
			line-height: 2rem;
			margin: 1rem;
		}

		.text-container {
			padding: 50px;
		}
	}

	@media (max-width: 800px) {
		h1 {
			font-size: 80px;
			letter-spacing: 0px;
			line-height: 70px;
			margin-bottom: 10px;
		}

		h2 {
			font-size: 2rem;
			line-height: 3rem;
			margin: 0rem;
		}
	}
</style>
