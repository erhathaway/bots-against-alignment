<div class="lds-app">
	<div />
	<div />
</div>

<style>
	.lds-app {
		display: inline-block;
		position: relative;
		width: 36px;
		height: 36px;
	}
	.lds-app div {
		position: absolute;
		border: 4px solid rgb(0, 0, 0);
		opacity: 1;
		border-radius: 50%;
		animation: lds-app 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
	}
	.lds-app div:nth-child(2) {
		animation-delay: -0.5s;
	}
	@keyframes lds-app {
		0% {
			top: 18px;
			left: 18px;
			width: 0;
			height: 0;
			opacity: 0;
		}
		4.9% {
			top: 18px;
			left: 18px;
			width: 0;
			height: 0;
			opacity: 0;
		}
		5% {
			top: 18px;
			left: 18px;
			width: 0;
			height: 0;
			opacity: 1;
		}
		100% {
			top: 0px;
			left: 0px;
			width: 36px;
			height: 36px;
			opacity: 0;
		}
	}
</style>
