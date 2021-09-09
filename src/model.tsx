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
  hazards: Coord[],
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

export enum Direction { Up, Down, Left, Right }
export type DirectionStr = keyof typeof Direction;

export interface Test {
  id: string,
  description: string,
  timestamp: number,
  game: Game,
  frames: Frame[],
  frameToTest: number,
  snakeToTest: number,
  expectedResult: DirectionStr[],
}

export type Passed = {
  type: "passed",
  move: DirectionStr,
}

export type Failed = {
  type: "failed",
  move?: DirectionStr,
  msg: string,
}

export type Pending = {
  type: "pending"
}

export type TestPreview = Pick<Test, "id" | "description" | "timestamp">

export interface TestResult extends TestPreview {
  result: Passed | Failed | Pending
}


export type Ok<T> = {
  type: "ok",
  value: T,
}
export type Error = {
  type: "error",
  msg: string,
}

export type Result<T> = Ok<T> | Error;

export function ok<T>(val: T): Ok<T> {
  return { type: "ok", value: val};
}

export function error(msg: string): Error {
  return { type: "error", msg};
}

export type AsyncState = {type: "initial" | "loading"} | {type: "done"} | {type: "error", message: string}
