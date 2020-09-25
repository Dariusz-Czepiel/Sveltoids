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
export interface GameObjects { ship: Ship[], asteroids: Asteroids[], bullets: Bullet[], particles: Particle[] }
export type GameObjectsBasicTypes = Unpacked<GameObjects[keyof GameObjects]>;
export type GameObjectsTypes = GameObjects[keyof GameObjects];
export type CreateObjectT = <T extends keyof GameObjects>(item: Unpacked<GameObjects[T]>, group: T) => void;
export interface RenderT { screen: ScreenDims, context: CanvasRenderingContext2D, keys: KeysT, asteroidCount: number, topScore: number, currentScore: number, inGame: boolean };
//zamien to na enum
export type ArrowKeys = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';
//export interface GameObjectClass { destroy: () => void, render: (state: RenderT) => void }
export interface GameObjectClass { render: (state: RenderT) => void }
export type WithEvents<TObj, TEvent> = Extract<TObj, TEvent>;
export type CollidableGameObjectTypes<T extends Arr> = WithEvents<GameObjectsBasicTypes, Collidable<T>>
type Arr = readonly unknown[];
export interface Collidable<T extends Arr> { onCollision: (object: GameObjectsBasicTypes, ...args: T) => unknown }
//export type Intersected<T[]>

//utility
export type Unpacked<T> = T extends (infer U)[] ? U : T;