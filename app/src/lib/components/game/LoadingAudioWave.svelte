<!-- From: https://fiddlesalad.com/css/css-audio-wave/ -->
<div id="container">
	<div id="preloader_1">
		<span></span>
		<span></span>
		<span></span>
		<span></span>
		<span></span>
	</div>
</div>

<style>
	#container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding: 2rem 0;
	}

	#preloader_1 {
		position: relative;
		background: transparent;
	}

	#preloader_1 span {
		display: block;
		bottom: 0px;
		width: 4px;
		height: 5px;
		border-radius: 2px;
		background: black;
		position: absolute;
		animation: preloader_1 1.5s infinite var(--ease);
	}

	#preloader_1 span:nth-child(2) {
		left: 11px;
		animation-delay: 0.2s;
	}

	#preloader_1 span:nth-child(3) {
		left: 22px;
		animation-delay: 0.4s;
	}

	#preloader_1 span:nth-child(4) {
		left: 33px;
		animation-delay: 0.6s;
	}

	#preloader_1 span:nth-child(5) {
		left: 44px;
		animation-delay: 0.8s;
	}

	@keyframes preloader_1 {
		0% {
			height: 5px;
			transform: translateY(0px);
			background: black;
		}
		25% {
			height: 30px;
			transform: translateY(15px);
			background: #C8A44E;
		}
		50% {
			height: 5px;
			transform: translateY(0px);
			background: black;
		}
		100% {
			height: 5px;
			transform: translateY(0px);
			background: black;
		}
	}
</style>
