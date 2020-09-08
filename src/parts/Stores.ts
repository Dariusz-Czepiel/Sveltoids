import { writable } from 'svelte/store';
import type { ScreenDims, KeysT, GameDataT } from './Types';

export const screenStore = writable<ScreenDims>({
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.devicePixelRatio || 1
});
export const keysStore = writable<KeysT>({
    left  : false,
    right : false,
    up    : false,
    down  : false,
    space : false
});
export const asteroidCountStore = writable<number>(3);
export const gameDataStore = writable<GameDataT>({
    currentScore: 0,
    inGame: false
});
export const topScoreStore = writable<number>(localStorage['topscore'] || 0);