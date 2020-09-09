import type Asteroids from '../objects/Asteroids';
import type Bullet from '../objects/Bullet';
import type Particle from '../objects/Particle';
import type Ship from '../objects/Ship';

export interface Point { x: number, y: number };
export interface ScreenDims { width: number, height: number, ratio: number };
export interface KeysT {
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean,
    space: boolean
}
export interface GameDataT { currentScore: number, inGame: boolean }
export type GameObjects = { ship: Ship[], asteroids: Asteroids[], bullets: Bullet[], particles: Particle[] }
export type GameObjectsBasicTypes = Unpacked<GameObjects[keyof GameObjects]>;
export type GameObjectsTypes = GameObjects[keyof GameObjects];
//zamien to na enum
export type ArrowKeys = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

//utility
export type Unpacked<T> = T extends (infer U)[] ? U : T;