import {Snake, Coord, Direction, Result, ok, error } from "../model";

export interface MoveRequest {
  board: {
    food: Coord[],
    snakes: SnakeRequest[],
    width: number,
    height: number,
  },
  game: {
    id: string,
    ruleset: {
      name: string,
      version: string,
    },
    timeout: number
  };
  turn: number,
  you: SnakeRequest,
}

export interface SnakeRequest {
  id: string,
  name: string,
  health: number,
  body: Coord[],
  latency: number,
  head: Coord,
  length: number,
  shout?: string,
  squad?: string,
}

export function sendRequest(url: string, board: MoveRequest): Promise<Result<Direction>> {
  const fetchOpts = {
    body:  JSON.stringify(board),
    method: "POST",
    mode : "cors" as const,
    headers: [
      ["content-type", "application/json"]
    ]
  };

  return fetch(url, fetchOpts)
    .then(res => res.json())
    .then((res) => {
      switch (res.move) {
        case ("up"):
          return ok(Direction.Up);
        case ("down"):
          return ok(Direction.Down);
        case ("left"):
          return ok(Direction.Left);
        case ("right"):
          return ok(Direction.Right);
        default:
          return error("invalid move");
      }
    })
    .catch(e => {
      console.log(e);
      return error("invalid move");
    });
}

export function createSnakeRequest(snake: Snake): SnakeRequest {
  return {
    id: snake.id,
    name: snake.name,
    health: snake.health,
    body: snake.body,
    latency: +snake.latency,
    head: snake.body[0],
    length: snake.body.length,
    shout: snake.shout,
    squad: snake.squad,
  };
}
