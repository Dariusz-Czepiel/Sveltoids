import React, { useState, useEffect, useRef } from 'react';
import Asteroid from './Asteroid';
import Ship from './Ship';
import { randomNumBetweenExcluding } from './helpers';
import '../ReacteroidsOS.css';

//kazdy przycisk na klawiaturze ma swoj numer
//to jest po to zeby od razu wiedziec ktory jest do czego i nie trzeba bylo pamietac
const KEY = {
  LEFT:  37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32
};

//wszystkie obiekty ktore widzisz na ekranie
let objects = {
  ship: [],
  asteroids: [],
  bullets: [],
  particles: [],
};

let context = null;

const ReacteroidsOS = () => {
  //dane dotyczace okna przegladarki
  const [screen, setScreen] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1
      });
  //informacja ktory przycisk jest przycisniety w danym momencie
  const [keys, setKeys] = useState({
    left  : 0,
    right : 0,
    up    : 0,
    down  : 0,
    space : 0,
  });
  //ilosc asteroid
  const [asteroidCount, setAsteroidCount] = useState(3);
  //dane gry. Wynik i informacja czy przegrales
  const [gameData, setGameData] = useState({
    currentScore: 0,
    inGame: false
  })
  //najlepszy wynik
  const [topScore, setTopScore] = useState(localStorage['topscore'] || 0);
  const canvasRef = useRef(null);

  const handleResize = (value, e) => {
    setScreen({
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.devicePixelRatio || 1,
    });
}

//obluga przyciskow
const handleKeys = (value, e) => {
  let keysTemp = keys;
  if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = value;
  if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = value;
  if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = value;
  if(e.keyCode === KEY.SPACE) keys.space = value;
  setKeys(keysTemp);
}

//wykonuje sie podczas pierwszego zaladowania na strone
useEffect(() => {
  window.addEventListener('keyup',   handleKeys.bind(this, false));
  window.addEventListener('keydown', handleKeys.bind(this, true));
  window.addEventListener('resize',  handleResize.bind(this, false));

  const context2D = canvasRef.current.getContext('2d');
  startGame();
  context = context2D;
  requestAnimationFrame(() => {update()});
  
  return () => {
    window.removeEventListener('keyup', handleKeys);
    window.removeEventListener('keydown', handleKeys);
    //nie dziala teraz
    window.removeEventListener('resize', handleResize);
  }
}, [])

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
    setAsteroidCount(count);
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
    setGameData({...gameData, currentScore: gameData.currentScore + points});
  }
}

//zaczyna gre
//tworzy statek i pierwsze asteroidy
const startGame = () => {
  setGameData({
    inGame: true,
    currentScore: 0,
  });
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
  setGameData({ ...gameData, inGame: false});

  // Replace top score
  if(gameData.currentScore > topScore){
    setTopScore(gameData.currentScore);
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
  let endgame;
  let message;

  if (gameData.currentScore <= 0) {
    message = '0 points... So sad.';
  } else if (gameData.currentScore >= topScore){
    message = 'Top score with ' + gameData.currentScore + ' points. Woo!';
  } else {
    message = gameData.currentScore + ' Points though :)'
  }

  if(!gameData.inGame){
    endgame = (
      <div className="endgame">
        <p>Game over, man!</p>
        <p>{message}</p>
        <button
          onClick={ startGame.bind(this) }>
          try again?
        </button>
      </div>
    )
  }

  return (
    <div>
      { endgame }
      <span className="score current-score" >Score: {gameData.currentScore}</span>
      <span className="score top-score" >Top Score: {topScore}</span>
      <span className="controls" >
        Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
        Use [SPACE] to SHOOT
      </span>
      <canvas ref={canvasRef}
        width={screen.width * screen.ratio}
        height={screen.height * screen.ratio}
      />
    </div>
  );
}

export default ReacteroidsOS;

/*
  ORIGINAL

export default class ReacteroidsOS extends Component {
  constructor() {
    super();
    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
      context: null,
      keys : {
        left  : 0,
        right : 0,
        up    : 0,
        down  : 0,
        space : 0,
      },
      asteroidCount: 3,
      currentScore: 0,
      topScore: localStorage['topscore'] || 0,
      inGame: false
    }
    this.ship = [];
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
  }

  handleResize(value, e){
    this.setState({
      screen : {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  handleKeys(value, e){
    let keys = this.state.keys;
    if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = value;
    if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = value;
    if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = value;
    if(e.keyCode === KEY.SPACE) keys.space = value;
    this.setState({
      keys : keys
    });
  }

  componentDidMount() {
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));
    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('resize',  this.handleResize.bind(this, false));

    const context = this.refs.canvas.getContext('2d');
    this.setState({ context: context });
    this.startGame();
    requestAnimationFrame(() => {this.update()});
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeys);
    window.removeEventListener('keydown', this.handleKeys);
    window.removeEventListener('resize', this.handleResize);
  }

  update() {
    const context = this.state.context;
    const keys = this.state.keys;
    const ship = this.ship[0];

    context.save();
    context.scale(this.state.screen.ratio, this.state.screen.ratio);

    // Motion trail
    context.fillStyle = '#000';
    context.globalAlpha = 0.4;
    context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
    context.globalAlpha = 1;

    // Next set of asteroids
    if(!this.asteroids.length){
      let count = this.state.asteroidCount + 1;
      this.setState({ asteroidCount: count });
      this.generateAsteroids(count)
    }

    // Check for colisions
    this.checkCollisionsWith(this.bullets, this.asteroids);
    this.checkCollisionsWith(this.ship, this.asteroids);

    // Remove or render
    this.updateObjects(this.particles, 'particles')
    this.updateObjects(this.asteroids, 'asteroids')
    this.updateObjects(this.bullets, 'bullets')
    this.updateObjects(this.ship, 'ship')

    context.restore();

    // Next frame
    requestAnimationFrame(() => {this.update()});
  }

  addScore(points){
    if(this.state.inGame){
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }

  startGame(){
    this.setState({
      inGame: true,
      currentScore: 0,
    });

    // Make ship
    let ship = new Ship({
      position: {
        x: this.state.screen.width/2,
        y: this.state.screen.height/2
      },
      create: this.createObject.bind(this),
      onDie: this.gameOver.bind(this)
    });
    this.createObject(ship, 'ship');

    // Make asteroids
    this.asteroids = [];
    this.generateAsteroids(this.state.asteroidCount)
  }

  gameOver(){
    this.setState({
      inGame: false,
    });

    // Replace top score
    if(this.state.currentScore > this.state.topScore){
      this.setState({
        topScore: this.state.currentScore,
      });
      localStorage['topscore'] = this.state.currentScore;
    }
  }

  generateAsteroids(howMany){
    let asteroids = [];
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this)
      });
      this.createObject(asteroid, 'asteroids');
    }
  }

  createObject(item, group){
    this[group].push(item);
  }

  updateObjects(items, group){
    let index = 0;
    for (let item of items) {
      if (item.delete) {
        this[group].splice(index, 1);
      }else{
        items[index].render(this.state);
      }
      index++;
    }
  }

  checkCollisionsWith(items1, items2) {
    var a = items1.length - 1;
    var b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){
        var item1 = items1[a];
        var item2 = items2[b];
        if(this.checkCollision(item1, item2)){
          item1.destroy();
          item2.destroy();
        }
      }
    }
  }

  checkCollision(obj1, obj2){
    var vx = obj1.position.x - obj2.position.x;
    var vy = obj1.position.y - obj2.position.y;
    var length = Math.sqrt(vx * vx + vy * vy);
    if(length < obj1.radius + obj2.radius){
      return true;
    }
    return false;
  }

  render() {
    //convert this to useEffects
    let endgame;
    let message;

    if (this.state.currentScore <= 0) {
      message = '0 points... So sad.';
    } else if (this.state.currentScore >= this.state.topScore){
      message = 'Top score with ' + this.state.currentScore + ' points. Woo!';
    } else {
      message = this.state.currentScore + ' Points though :)'
    }

    if(!this.state.inGame){
      endgame = (
        <div className="endgame">
          <p>Game over, man!</p>
          <p>{message}</p>
          <button
            onClick={ this.startGame.bind(this) }>
            try again?
          </button>
        </div>
      )
    }

    return (
      <div>
        { endgame }
        <span className="score current-score" >Score: {this.state.currentScore}</span>
        <span className="score top-score" >Top Score: {this.state.topScore}</span>
        <span className="controls" >
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
          Use [SPACE] to SHOOT
        </span>
        <canvas ref="canvas"
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
        />
      </div>
    );
  }
}*/