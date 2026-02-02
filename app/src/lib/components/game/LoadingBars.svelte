<div class="lds-anim">
	<div></div>
	<div></div>
	<div></div>
</div>

<style>
	.lds-anim {
		display: inline-block;
		position: relative;
		width: 48px;
		height: 48px;
	}

	.lds-anim div {
		display: inline-block;
		position: absolute;
		left: 4px;
		width: 8px;
		border-radius: 2px;
		background: var(--color-text);
		animation: lds-anim 1.2s cubic-bezier(0, 0.5, 0.5, 1) infinite;
	}

	.lds-anim div:nth-child(1) {
		left: 4px;
		animation-delay: -0.24s;
	}

	.lds-anim div:nth-child(2) {
		left: 20px;
		animation-delay: -0.12s;
	}

	.lds-anim div:nth-child(3) {
		left: 36px;
		animation-delay: 0;
	}

	@keyframes lds-anim {
		0% {
			top: 4px;
			height: 40px;
		}
		50%,
		100% {
			top: 14px;
			height: 20px;
		}
	}
</style>
