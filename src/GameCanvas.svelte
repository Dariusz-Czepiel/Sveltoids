<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
    import { screen } from './functional/Stores';
    export let canvasRef: HTMLCanvasElement;

	const handleResize = (e: UIEvent) => {
		screen.set({
		width: window.innerWidth,
		height: window.innerHeight,
		ratio: window.devicePixelRatio || 1,
		});
	}

	onMount(() => {
	window.addEventListener('resize',  handleResize);
	});

	onDestroy(() => {
	window.removeEventListener('resize', handleResize);
	});
</script>

<canvas bind:this={canvasRef}
    width={$screen.width * $screen.ratio}
    height={$screen.height * $screen.ratio}
/>

<style>
  canvas {
	display: block;
	background-color: #000000;
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	width: 100%;
	height: 100%;
  }
</style>