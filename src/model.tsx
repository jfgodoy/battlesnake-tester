export interface Game {
  id: string,
  ruleset: {
    name: string,
    version: string,
  },
  timeout: number,
  width: number,
  height: number,
}

export interface Frame {
  turn: number,
  snakes: Snake[],
  food: Coord[],
  hazards: any[],
}

export interface Snake {
  id: string,
  name: string,
  url: string,
  body: Coord[],
  health: number,
  death?: Death,
  color: string,
  headType: string,
  tailType: string,
  latency: string,
  shout: string,
  squad: string,
  author: string,
}

export interface Death {
  cause: string,
  turn: number,
  eliminatedBy: string,
}

export interface Coord {
  x: number,
  y: number,
}

export enum Direction { Up, Down, Left, Right };
