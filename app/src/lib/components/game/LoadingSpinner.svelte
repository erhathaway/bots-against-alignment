<div class="lds-app">
	<div></div>
	<div></div>
</div>

<style>
	.lds-app {
		display: inline-block;
		position: relative;
		width: 28px;
		height: 28px;
	}

	.lds-app div {
		position: absolute;
		border: 2px solid var(--color-accent);
		opacity: 1;
		border-radius: 50%;
		animation: lds-app 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
		box-shadow: 0 0 8px rgba(230, 200, 50, 0.3);
	}

	.lds-app div:nth-child(2) {
		animation-delay: -0.5s;
	}

	@keyframes lds-app {
		0% {
			top: 14px;
			left: 14px;
			width: 0;
			height: 0;
			opacity: 0;
		}
		4.9% {
			top: 14px;
			left: 14px;
			width: 0;
			height: 0;
			opacity: 0;
		}
		5% {
			top: 14px;
			left: 14px;
			width: 0;
			height: 0;
			opacity: 1;
		}
		100% {
			top: 0px;
			left: 0px;
			width: 28px;
			height: 28px;
			opacity: 0;
		}
	}
</style>
