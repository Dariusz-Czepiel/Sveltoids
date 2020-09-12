import type { GameObjectsTypes, GameObjectsBasicTypes } from '../functional/Types';

export const checkCollisionsWith = (items1: GameObjectsTypes, items2: GameObjectsTypes) => {
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