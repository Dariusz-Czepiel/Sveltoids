import { writable } from 'svelte/store';
import type { ScreenDims, KeysT, GameDataT } from '../functional/Types';

//dane dotyczace okna przegladarki
export const screen = writable<ScreenDims>({
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.devicePixelRatio || 1
});
//informacja ktory przycisk jest przycisniety w danym momencie
export const keys = writable<KeysT>({
    left  : false,
    right : false,
    up    : false,
    down  : false,
    space : false
});
//ilosc asteroid
export const asteroidCount = writable<number>(3);
//dane gry. Wynik i informacja czy przegrales
export const gameData = writable<GameDataT>({
    currentScore: 0,
    inGame: false
});
//najlepszy wynik
//moze uzyj czegos innego niz localstorage
export const topScore = writable<number>(localStorage['topscore'] || 0);