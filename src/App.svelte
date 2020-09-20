<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
	import Asteroid from './objects/Asteroids';
  import Ship from './objects/Ship';
  import UI from './UI.svelte';
  import GameCanvas from './GameCanvas.svelte';
  
  import { randomNumBetweenExcluding } from './functional/helpers';
  import { screen, keys, asteroidCount, gameData, topScore } from './functional/Stores'
  import type { GameObjects, GameObjectsTypes, GameObjectsBasicTypes, CreateObjectT, ScreenDims, ArrowKeys, KeysT } from './functional/Types';

	// const KEY = {
	// 	LEFT:  37,
	// 	RIGHT: 39,
	// 	UP: 38,
	// 	A: 65,
	// 	D: 68,
	// 	W: 87,
	// 	SPACE: 32
	// };

	let objects: GameObjects = {
		ship: [],
		asteroids: [],
		bullets: [],
		particles: [],
	};

	let context: CanvasRenderingContext2D;
  let canvasRef: HTMLCanvasElement;
  let isMobile: boolean = false;

//obluga przyciskow
const handleKeys = (e: KeyboardEvent) => {
  let keysTemp = $keys;
  const isPressed = e.type === 'keydown';
  //TODO zmien to na key i zobacz jakie sa
  //console.log(e.code);
  //sprawdz jeszcze e.code
  if(e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') $keys.left  = isPressed;
  if(e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') $keys.right = isPressed;
  if(e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') $keys.up    = isPressed;
  if(e.key ===  ' ') $keys.space = isPressed;
  // if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) $keys.left  = isPressed;
  // if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) $keys.right = isPressed;
  // if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) $keys.up    = isPressed;
  // if(e.keyCode === KEY.SPACE) $keys.space = isPressed;
  keys.set(keysTemp);
}

onMount(() => {
  window.addEventListener('keyup',   handleKeys);
  window.addEventListener('keydown', handleKeys);

  const context2D = canvasRef.getContext('2d');
  startGame();
  if(context2D != null)
  {
    context = context2D;
    requestAnimationFrame(() => {update()});
  }

  //check if mobile
  if('maxTouchPoints' in navigator || 'msMacTouchPoints' in navigator)
    isMobile = navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  //console.log(isMobile)
  //alert(isMobile ? "yes" : "no");

});

onDestroy(() => {
  window.removeEventListener('keyup', handleKeys);
  window.removeEventListener('keydown', handleKeys);
});

//dzieje sie za kazdym razem kiedy cos sie zmienia na canvas
const update = () => {
  const contextTemp = context;
  contextTemp.save();
  contextTemp.scale($screen.ratio, $screen.ratio);

  // Motion trail
  contextTemp.fillStyle = '#000';
  contextTemp.globalAlpha = 0.4;
  contextTemp.fillRect(0, 0, $screen.width, $screen.height);
  contextTemp.globalAlpha = 1;

  // Next set of asteroids
  if(!objects.asteroids.length){
    let count = $asteroidCount + 1;
    asteroidCount.set(count);
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

const addScore = (points: number) => {
  if($gameData.inGame){
    gameData.update(gd => ({...gd, currentScore: gd.currentScore + points}));
  }
}

//zaczyna gre
//tworzy statek i pierwsze asteroidy
const startGame = () => {
  gameData.set({ inGame: true, currentScore: 0 });
  // Make ship
  const ship = new Ship({
    position: {
      x: $screen.width/2,
      y: $screen.height/2
    },
    create: createObject.bind(this),
    onDie: gameOver.bind(this)
  });
  createObject(ship, 'ship');

  // Make asteroids
  objects.asteroids = [];
  generateAsteroids($asteroidCount)
}

//konczy gre
//zapisuje najlepszy wynik i wyswietla div-a z Game Over
const gameOver = () => {
  gameData.update(gd => ({...gd, inGame: false}));

  // Replace top score
  if($gameData.currentScore > $topScore){
    topScore.set($gameData.currentScore);
    localStorage['topscore'] = $gameData.currentScore;
  }
}

//generuje asteroidy w ilosci takiej jak howMany
const generateAsteroids = (howMany: number) => {
  //let asteroids = [];
  let myShip = objects.ship[0];
  //console.log(objects.ship);
  for (let i = 0; i < howMany; i++) {
    let asteroid = new Asteroid({
      size: 80,
      position: {
        x: randomNumBetweenExcluding(0, $screen.width, myShip.position.x-60, myShip.position.x+60),
        y: randomNumBetweenExcluding(0, $screen.height, myShip.position.y-60, myShip.position.y+60)
      },
      create: createObject.bind(this),
      addScore: addScore.bind(this)
    });
    createObject(asteroid, 'asteroids');
  }
}



//dodaje statki,asteroidy,pociski i efekty
const createObject: CreateObjectT = (item, group) => {
  (objects[group] as typeof item[]).push(item);
}

//aktualizuje statki,asteroidy,pociski i efekty
const updateObjects = <T extends keyof GameObjects>(items: GameObjects[T], group: T) => {
  //console.log(items);
  let index = 0;
  for (let item of items) {
    if (item.delete) {
      objects[group].splice(index, 1);
    }else{
      items[index].render({
        screen: $screen, context, keys: $keys, asteroidCount: $asteroidCount,
        topScore: $topScore, currentScore: $gameData.currentScore, inGame: $gameData.inGame
      });
    }
    index++;
  }
}
//sprawdza zderzenie sie 2 obiektow np.: czy asteroida zderzyla sie z statkiem
const checkCollisionsWith = (items1: GameObjectsTypes, items2: GameObjectsTypes) => {
  var a = items1.length - 1;
  var b: number;
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
const checkCollision = (obj1: GameObjectsBasicTypes, obj2: GameObjectsBasicTypes) => {
  var vx = obj1.position.x - obj2.position.x;
  var vy = obj1.position.y - obj2.position.y;
  var length = Math.sqrt(vx * vx + vy * vy);
  if(length < obj1.radius + obj2.radius){
    return true;
  }
  return false;
}

  let message: string;

  //kod ponizej obsluguje koniec gry
  $: if ($gameData.currentScore <= 0) {
    message = '0 points... So sad.';
  } else if ($gameData.currentScore >= $topScore){
    message = 'Top score with ' + $gameData.currentScore + ' points. Woo!';
  } else {
    message = $gameData.currentScore + ' Points though :)'
  }
</script>

<div class="container">
  <UI gameData={$gameData} {message} topScore={$topScore} {startGame} {isMobile} />
  <GameCanvas bind:canvasRef={canvasRef} />
</div>

<style>
	.container {
	padding: 0;
	margin: 0;
	/*font-family: 'PT Mono', serif;*/
	color: #ffffff;
  }
</style>