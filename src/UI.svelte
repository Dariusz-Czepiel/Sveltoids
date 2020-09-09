<script lang="ts">
    import type { GameDataT } from './functional/Types';

    export let gameData: GameDataT;
    export let message: string;
    export let topScore: number;
    export let startGame: () => void;
</script>

{#if !gameData.inGame}
    <div class="endgame">
    <p>Game over, man!</p>
    <p>{message}</p>
    <button on:click={ () => startGame() }>
        try again?
    </button>
    </div>
{/if}
<span class="score current-score" >Score: {gameData.currentScore}</span>
<span class="score top-score" >Top Score: {topScore}</span>
<span class="controls" >
    Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
    Use [SPACE] to SHOOT
</span>

<style>
.endgame{
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	padding: 16px;
	z-index: 1;
	text-align: center;
	font-size: 1.2rem;
  }
  .current-score {
	left: 20px;
  }
  .top-score {
	right: 20px;
  }
  .score {
	display: block;
	position: absolute;
	top: 15px;
	z-index: 1;
	font-size: 1.3rem;
  }
  .controls {
	display: block;
	position: absolute;
	top: 15px;
	left: 50%;
	transform: translate(-50%, 0);
	z-index: 1;
	font-size: 1rem;
	text-align: center;
	line-height: 1.6;
  }
  button{
	border: 4px solid #ffffff;
	background-color: transparent;
	color: #ffffff;
	font-size: 1rem;
	padding: 10px 20px;
	margin: 10px;
	/*font-family: 'PT Mono', serif;*/
	cursor: pointer;
  }
  button:hover{
	background-color: #ffffff;
	color: #000000;
  }
</style>