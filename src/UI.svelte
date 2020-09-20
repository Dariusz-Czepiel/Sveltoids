<script lang="ts">
    import type { GameDataT } from './functional/Types';

	export let isMobile: boolean;
    export let gameData: GameDataT;
    export let message: string;
    export let topScore: number;
	export let startGame: () => void;
	
	const baseFontSize = isMobile ? "2em" : "1.2em";
	const endGameFontSize = Number(baseFontSize[0]) * 1.5 + "em";
</script>

{#if !gameData.inGame}
<div class="endgame" style="--eg-font-size: {endGameFontSize};">
    <p>Game over, man!</p>
    <p>{message}</p>
    <button on:click={ () => startGame() }>
        try again?
    </button>
</div>
{/if}
<div class="ui-top-container" style="--font-size: {baseFontSize};">
	<div class="score">Score: {gameData.currentScore}</div>
	<div class="score controls" >
		Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
		Use [SPACE] to SHOOT
	</div>
	<div class="score">Top Score: {topScore}</div>
</div>

<style>
.ui-top-container {
	display: flex;
	width: calc(100% - 20px);
	justify-content: space-between;
	flex-direction: row;
	margin: 0 10px 0 10px;
}
/* moze zmien to pozycjonowanie na cos fajniejszego */
.endgame{
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	padding: 16px;
	z-index: 1;
	text-align: center;
	font-size: var(--eg-font-size);
  }
  .score {
	z-index: 1;
	font-size: var(--font-size);
  }
  .controls {

	text-align: center;
	line-height: 1.5;
	letter-spacing: 0.05em;
  }
  button{
	border: 4px solid #ffffff;
	background-color: transparent;
	color: #ffffff;
	font-size: var(--font-size);
	padding: 10px 20px;
	margin: 10px;
	cursor: pointer;
  }
  button:hover{
	background-color: #ffffff;
	color: #000000;
  }
</style>