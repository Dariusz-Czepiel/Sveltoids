export interface Point { x: number, y: number };
export interface ScreenDims { width: number, height: number, ratio: number };
export interface KeysT {
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean,
    space: boolean
}
export interface GameDataT {currentScore: number, inGame: boolean }
//zamien to na enum
export type ArrowKeys = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';