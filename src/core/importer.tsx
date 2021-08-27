/* eslint @typescript-eslint/no-explicit-any: "off" */

import { formatFrame } from "./frame";
import { Game, Frame } from "../model";
import { sort } from "ramda";

const DEFAULT_VERSION =  "v.1.2.3";

async function get(url: string) {
  const response = await fetch(url);
  if (response.status === 200) {
    return Promise.resolve(response.json());
  } else {
    return Promise.resolve(response.json()).then(responseJson => {
      console.error(responseJson.error);
      return Promise.reject(responseJson.error);
    });
  }
}

export async function importGame(gameId: string): Promise<{game: Game, frames: Frame[]}> {
  const url = `https://engine.battlesnake.com/games/${gameId}`;
  const res = await get(url);
  const game: Game = {
    id: res.Game.ID,
    ruleset: {
      name: res.Game.Ruleset.name,
      version: DEFAULT_VERSION,
    },
    width: res.Game.Width,
    height: res.Game.Height,
    timeout: res.Game.SnakeTimeout,
  };
  const framesUrl = `wss://engine.battlesnake.com/socket/${gameId}`;
  const frames = await fetchAllFrames(framesUrl, formatFrame);
  return {game, frames};
}

// Establishes websocket connection on given url and then calls parseToFrame for
// every object sent from the server. Returns a promise with all the frames collected
// until the server closes the connection.
export function fetchAllFrames(url: string, parseToFrame: (obj: any) => Frame ): Promise<Frame[]> {
  const frames: Map<string, Frame> = new Map();
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener("message", ({data}) => {
      try {
        const obj: any = JSON.parse(data);
        const frame = parseToFrame(obj);
        frames.set(frame.turn.toString(), frame);
      } catch (err) {
        reject(err);
      }
    });
    ws.addEventListener("close", function close() {
      const arrayFrames = sort((a, b) => a.turn - b.turn, [...frames.values()]);
      const lastIdx = arrayFrames.length - 1;
      const last = arrayFrames[lastIdx];
      if (last.turn !== lastIdx) {
        reject(new Error("missing some frames"));
      } else {
        resolve(arrayFrames);
      }
    });
  });
}
