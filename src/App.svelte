<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
	import Asteroid from './parts/Asteroids';
	import Ship from './parts/Ship';
  import { randomNumBetweenExcluding } from './parts/helpers';
  import { screenStore, keysStore, asteroidCountStore, gameDataStore, topScoreStore } from './parts/Stores'
  import type { ScreenDims, KeysT, GameDataT } from './parts/Types';

	const KEY = {
		LEFT:  37,
		RIGHT: 39,
		UP: 38,
		A: 65,
		D: 68,
		W: 87,
		SPACE: 32
	};

	let objects = {
		ship: [],
		asteroids: [],
		bullets: [],
		particles: [],
	};

	let context = null;

	
   //dane dotyczace okna przegladarki
  let screen: ScreenDims;
  const unsubscribeScreen = screenStore.subscribe(value => { screen = value; });
  // const [screen, setScreen] = useState({
  //       width: window.innerWidth,
  //       height: window.innerHeight,
  //       ratio: window.devicePixelRatio || 1
  //     });
  //informacja ktory przycisk jest przycisniety w danym momencie
  let keys: KeysT;
  const unsubscribeKeys = keysStore.subscribe(value => { keys = value; });
  // const [keys, setKeys] = useState({
  //   left  : 0,
  //   right : 0,
  //   up    : 0,
  //   down  : 0,
  //   space : 0,
  // });
  //ilosc asteroid
  let asteroidCount: number;
  const unsubscribeAsteroidCount = asteroidCountStore.subscribe(value => { asteroidCount = value; });
  //const [asteroidCount, setAsteroidCount] = useState(3);
  //dane gry. Wynik i informacja czy przegrales
  let gameData: GameDataT;
  const unsubscribeGameData = gameDataStore.subscribe(value => { gameData = value; });
  // const [gameData, setGameData] = useState({
  //   currentScore: 0,
  //   inGame: false
  // })
  //najlepszy wynik
  //moze uzyj czegos innego niz localstorage
  let topScore: number;
  const unsubscribeTopScore = topScoreStore.subscribe(value => { topScore = value; });
  //const [topScore, setTopScore] = useState(localStorage['topscore'] || 0);
  let canvasRef: HTMLCanvasElement;

  const handleResize = (e: UIEvent) => {
    screenStore.set({
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.devicePixelRatio || 1,
    });
}

//obluga przyciskow
// const handleKeys = (value, e) => {
//   let keysTemp = keys;
//   if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = value;
//   if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = value;
//   if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = value;
//   if(e.keyCode === KEY.SPACE) keys.space = value;
//   keysStore.set(keysTemp);
// }
const handleKeys = (e: KeyboardEvent) => {
  let keysTemp = keys;
  const isPressed = e.type === 'keydown';
  //TODO zmien to na key i zobacz jakie sa
  if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = isPressed;
  if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = isPressed;
  if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = isPressed;
  //TODO obsluz down i s jako keycode?
  if(e.keyCode === KEY.SPACE) keys.space = isPressed;
  keysStore.set(keysTemp);
}

//wykonuje sie podczas pierwszego zaladowania na strone
onMount(() => {
  window.addEventListener('keyup',   handleKeys);
  window.addEventListener('keydown', handleKeys);
  window.addEventListener('resize',  handleResize);

  const context2D = canvasRef.getContext('2d');
  startGame();
  context = context2D;
  requestAnimationFrame(() => {update()});
});
onDestroy(() => {
  window.removeEventListener('keyup', handleKeys);
  window.removeEventListener('keydown', handleKeys);
  //nie dziala teraz
  window.removeEventListener('resize', handleResize);
});
// useEffect(() => {
//   window.addEventListener('keyup',   handleKeys.bind(this, false));
//   window.addEventListener('keydown', handleKeys.bind(this, true));
//   window.addEventListener('resize',  handleResize.bind(this, false));

//   const context2D = canvasRef.getContext('2d');
//   startGame();
//   context = context2D;
//   requestAnimationFrame(() => {update()});
  
//   return () => {
//     window.removeEventListener('keyup', handleKeys);
//     window.removeEventListener('keydown', handleKeys);
//     //nie dziala teraz
//     window.removeEventListener('resize', handleResize);
//   }
// }, [])

//dzieje sie za kazdym razem kiedy cos sie zmienia na canvas
const update = () => {
  const contextTemp = context;

  contextTemp.save();
  contextTemp.scale(screen.ratio, screen.ratio);

  // Motion trail
  contextTemp.fillStyle = '#000';
  contextTemp.globalAlpha = 0.4;
  contextTemp.fillRect(0, 0, screen.width, screen.height);
  contextTemp.globalAlpha = 1;

  // Next set of asteroids
  if(!objects.asteroids.length){
    let count = asteroidCount + 1;
    asteroidCountStore.set(count);
    generateAsteroids(count);
  }

  // Check for colisions
  checkCollisionsWith(objects.bullets, objects.asteroids);
  checkCollisionsWith(objects.ship, objects.asteroids);

  // Remove or render
  updateObjects(objects.particles, 'particles')
  updateObjects(objects.asteroids, 'asteroids')
  updateObjects(objects.bullets, 'bullets')
  updateObjects(objects.ship, 'ship')

  contextTemp.restore();

  // Next frame
  requestAnimationFrame(() => {update()});
}

const addScore = (points) => {
  if(gameData.inGame){
    gameDataStore.update(gd => ({...gd, currentScore: gd.currentScore + points}));
  }
}

//zaczyna gre
//tworzy statek i pierwsze asteroidy
const startGame = () => {
  gameDataStore.set({ inGame: true, currentScore: 0 });
  // Make ship
  const ship = new Ship({
    position: {
      x: screen.width/2,
      y: screen.height/2
    },
    create: createObject.bind(this),
    onDie: gameOver.bind(this)
  });
  createObject(ship, 'ship');

  // Make asteroids
  objects.asteroids = [];
  generateAsteroids(asteroidCount)
}

//konczy gre
//zapisuje najlepszy wynik i wyswietla div-a z Game Over
const gameOver = () => {
  gameDataStore.set({ ...gameData, inGame: false});

  // Replace top score
  if(gameData.currentScore > topScore){
    topScoreStore.set(gameData.currentScore);
    localStorage['topscore'] = gameData.currentScore;
  }
}

//generuje asteroidy w ilosci takiej jak howMany
const generateAsteroids = (howMany) => {
  let asteroids = [];
  let myShip = objects.ship[0];
  console.log(objects.ship);
  for (let i = 0; i < howMany; i++) {
    let asteroid = new Asteroid({
      size: 80,
      position: {
        x: randomNumBetweenExcluding(0, screen.width, myShip.position.x-60, myShip.position.x+60),
        y: randomNumBetweenExcluding(0, screen.height, myShip.position.y-60, myShip.position.y+60)
      },
      create: createObject.bind(this),
      addScore: addScore.bind(this)
    });
    createObject(asteroid, 'asteroids');
  }
}

//dodaje statki,asteroidy,pociski i efekty
const createObject = (item, group) => {
  objects[group].push(item);
}
//aktualizuje statki,asteroidy,pociski i efekty
const updateObjects = (items, group) => {
  let index = 0;
  for (let item of items) {
    if (item.delete) {
      objects[group].splice(index, 1);
    }else{
      items[index].render({screen, context, keys, asteroidCount, topScore, currentScore: gameData.currentScore, inGame: gameData.inGame});
    }
    index++;
  }
}
//sprawdza zderzenie sie 2 obiektow np.: czy asteroida zderzyla sie z statkiem
//type this
const checkCollisionsWith = (items1, items2) => {
  var a = items1.length - 1;
  var b;
  for(a; a > -1; --a){
    b = items2.length - 1;
    for(b; b > -1; --b){
      var item1 = items1[a];
      var item2 = items2[b];
      if(checkCollision(item1, item2)){
        item1.destroy();
        item2.destroy();
      }
    }
  }
}
//type this
const checkCollision = (obj1, obj2) => {
  var vx = obj1.position.x - obj2.position.x;
  var vy = obj1.position.y - obj2.position.y;
  var length = Math.sqrt(vx * vx + vy * vy);
  if(length < obj1.radius + obj2.radius){
    return true;
  }
  return false;
}

  //kod ponizej obsluguje koniec gry
  let message: string;

  if (gameData.currentScore <= 0) {
    message = '0 points... So sad.';
  } else if (gameData.currentScore >= topScore){
    message = 'Top score with ' + gameData.currentScore + ' points. Woo!';
  } else {
    message = gameData.currentScore + ' Points though :)'
  }

  // if(!gameData.inGame){
  //   endgame = (
  //     <div className="endgame">
  //       <p>Game over, man!</p>
  //       <p>{message}</p>
  //       <button
  //         on:click={ startGame.bind(this) }>
  //         try again?
  //       </button>
  //     </div>
  //   )
  // }
</script>

<div class="container">
  {#if !gameData.inGame}
    <div class="endgame">
      <p>Game over, man!</p>
      <p>{message}</p>
      <button
        on:click={ startGame.bind(this) }>
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
	<canvas bind:this={canvasRef}
		width={screen.width * screen.ratio}
		height={screen.height * screen.ratio}
	/>
</div>

<style>
	.container {
	padding: 0;
	margin: 0;
	font-family: 'PT Mono', serif;
	color: #ffffff;
  }
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
	font-size: 20px;
  }
  .controls {
	display: block;
	position: absolute;
	top: 15px;
	left: 50%;
	transform: translate(-50%, 0);
	z-index: 1;
	font-size: 11px;
	text-align: center;
	line-height: 1.6;
  }
  .endgame{
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	padding: 16px;
	z-index: 1;
	text-align: center;
  }
  button{
	border: 4px solid #ffffff;
	background-color: transparent;
	color: #ffffff;
	font-size: 20px;
	padding: 10px 20px;
	margin: 10px;
	font-family: 'PT Mono', serif;
	cursor: pointer;
  }
  button:hover{
	background-color: #ffffff;
	color: #000000;
  }
</style>