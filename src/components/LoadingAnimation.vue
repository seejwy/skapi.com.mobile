<template lang="pug">
svg(width="16", height="16")
	circle(cx="12", cy="12", r="8", stroke="currentColor", stroke-width="2.5", fill="none", stroke-linecap="round")
</template>
<style lang="less" scoped>
svg {
	position: absolute;
	width: 24px !important;
	height: 24px !important;
	left: unset !important;
	vertical-align: middle;

	circle {
		stroke-dasharray: 50, 50;
		stroke-dashoffset: 10;
		transform: rotate(-90deg);
		transform-origin: 50% 50%;
		animation: animate 1s linear infinite;
	}

	@keyframes animate {
		0% {
			stroke-dashoffset: 50;
			stroke-dasharray: 50, 50;
		}
		50% {
			stroke-dashoffset: 0;
			stroke-dasharray: 20, 50;
		}
		100% {
			stroke-dashoffset: -50;
			stroke-dasharray: 50, 50;
		}
	}
}
</style>