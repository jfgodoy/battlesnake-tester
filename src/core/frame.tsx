/* eslint @typescript-eslint/no-explicit-any: "off", @typescript-eslint/explicit-module-boundary-types: "off" */

import type {Frame, Snake, Death } from "../model";

export function formatFrame(frame: any): Frame {
  cleanFrame(frame);
  return {
    turn: frame.Turn,
    snakes: frame.Snakes.map(formatSnake),
    food: frame.Food.map(formatPosition),
    hazards: frame.Hazards.map(formatPosition),
  };
}

function formatSnake(snake: any): Snake {
  return {
    id: snake.ID,
    name: snake.Name,
    body: snake.Body.map(formatPosition),
    color: snake.Color,
    health: snake.Health,
    latency: snake.Latency,
    death: formatDeath(snake.Death),
    headType: snake.HeadType && snake.HeadType.toLowerCase() || "default",
    tailType: snake.TailType && snake.TailType.toLowerCase() || "default",
    squad: snake.Squad,
    author: snake.Author,
    shout: snake.Shout,
    url: snake.URL,
  };
}

function formatDeath(death: any): Death | undefined {
  if (death) {
    return {
      cause: death.Cause,
      turn: death.Turn || 0,
      eliminatedBy: death.EliminatedBy,
    };
  }
}

function formatPosition(pos: any) {
  return {
    x: pos.X,
    y: pos.Y
  };
}

// This is a workaround for fields that are omitted when they have the default
// value. ie: int fields that need to default to 0 rather than undefined.
function cleanFrame(frame: any) {
  frame.Turn = frame.Turn || 0;

  for (const snake of frame.Snakes) {
    for (const part of snake.Body) {
      part.X = part.X || 0;
      part.Y = part.Y || 0;
    }
  }

  for (const food of frame.Food) {
    food.X = food.X || 0;
    food.Y = food.Y || 0;
  }
}
