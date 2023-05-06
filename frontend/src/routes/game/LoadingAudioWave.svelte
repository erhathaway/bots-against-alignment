<!-- From: https://fiddlesalad.com/css/css-audio-wave/ -->
<div id="container">
	<div id="preloader_1">
		<span />
		<span />
		<span />
		<span />
		<span />
	</div>
</div>

<style>
	#container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		margin-top: 3rem;
		margin-right: 3rem;
	}
	#preloader_1 {
		position: absolute;
		left: 50%;
		top: 50%;
		background: #ecf0f1;
	}
	#preloader_1 span {
		display: block;
		bottom: 0px;
		width: 9px;
		height: 5px;
		background: black;
		position: absolute;
		-webkit-animation: preloader_1 1.5s infinite ease-in-out;
		-moz-animation: preloader_1 1.5s infinite ease-in-out;
		-ms-animation: preloader_1 1.5s infinite ease-in-out;
		-o-animation: preloader_1 1.5s infinite ease-in-out;
		animation: preloader_1 1.5s infinite ease-in-out;
	}

	#preloader_1 span:nth-child(2) {
		left: 11px;
		-webkit-animation-delay: 0.2s;
		-moz-animation-delay: 0.2s;
		-ms-animation-delay: 0.2s;
		-o-animation-delay: 0.2s;
		animation-delay: 0.2s;
	}
	#preloader_1 span:nth-child(3) {
		left: 22px;
		-webkit-animation-delay: 0.4s;
		-moz-animation-delay: 0.4s;
		-ms-animation-delay: 0.4s;
		-o-animation-delay: 0.4s;
		animation-delay: 0.4s;
	}
	#preloader_1 span:nth-child(4) {
		left: 33px;
		-webkit-animation-delay: 0.6s;
		-moz-animation-delay: 0.6s;
		-ms-animation-delay: 0.6s;
		-o-animation-delay: 0.6s;
		animation-delay: 0.6s;
	}
	#preloader_1 span:nth-child(5) {
		left: 44px;
		-webkit-animation-delay: 0.8s;
		-moz-animation-delay: 0.8s;
		-ms-animation-delay: 0.8s;
		-o-animation-delay: 0.8s;
		animation-delay: 0.8s;
	}
	@-webkit-keyframes preloader_1 {
		0% {
			height: 5px;
			-webkit-transform: translateY(0px);
			background: black;
		}
		25% {
			height: 30px;
			-webkit-transform: translateY(15px);
			background: rgb(123, 255, 0);
		}
		50% {
			height: 5px;
			-webkit-transform: translateY(0px);
			background: black;
		}
		100% {
			height: 5px;
			-webkit-transform: translateY(0px);
			background: black;
		}
	}

	@-moz-keyframes preloader_1 {
		0% {
			height: 5px;
			-moz-transform: translateY(0px);
			background: black;
		}
		25% {
			height: 30px;
			-moz-transform: translateY(15px);
			background: rgb(123, 255, 0);
		}
		50% {
			height: 5px;
			-moz-transform: translateY(0px);
			background: black;
		}
		100% {
			height: 5px;
			-moz-transform: translateY(0px);
			background: black;
		}
	}

	@-ms-keyframes preloader_1 {
		0% {
			height: 5px;
			-ms-transform: translateY(0px);
			background: black;
		}
		25% {
			height: 30px;
			-ms-transform: translateY(15px);
			background: rgb(123, 255, 0);
		}
		50% {
			height: 5px;
			-ms-transform: translateY(0px);
			background: black;
		}
		100% {
			height: 5px;
			-ms-transform: translateY(0px);
			background: black;
		}
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
			background: rgb(123, 255, 0);
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
