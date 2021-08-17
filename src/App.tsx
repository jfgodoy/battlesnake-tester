import { Component, Show, createEffect, createResource, createMemo, lazy } from "solid-js";

import styles from "./App.module.css";
import Board from "./components/board";

import { formatFrame } from "./utils/frame";
import { themes } from "./theme";
import { prefetchSvgs } from "./utils/render";
import { Game, Frame } from "./model";


const App: Component = () => {
  const game: Game = {"id":"abf03cb2-b7e8-4723-ae50-8e3045d8f47d","ruleset":{"name":"standard","version":"v.1.2.3"},"width":11,"height":11,"timeout":500};
  const raw_frame = {"Turn":106,"Snakes":[{"ID":"gs_wvYGXWvhGg3SQgDTPqG9fXHT", "Name":"cc-battlesnake","URL":"", "Body":[{"X":9,"Y":11},{"X":9,"Y":10},{"X":9,"Y":9}],"Health":98,"Death":{"Cause":"wall-collision","Turn":2,"EliminatedBy":""},"Color":"#4d004d","HeadType":"silly","TailType":"pixel","Latency":"0","Shout":"","Squad":"","APIVersion":"","Author":"ccntrq"},{"ID":"gs_xjwhQm9cPypTFGPXWd9jW6M8","Name":"samees noodle","URL":"","Body":[{"X":6,"Y":6},{"X":6,"Y":5},{"X":7,"Y":5},{"X":8,"Y":5},{"X":9,"Y":5},{"X":9,"Y":6},{"X":9,"Y":7},{"X":10,"Y":7},{"X":10,"Y":6},{"X":10,"Y":5}],"Health":98,"Death":null,"Color":"#800000","HeadType":"default","TailType":"default","Latency":"220","Shout":"","Squad":"","APIVersion":"","Author":"s11mee"},{"ID":"gs_TKy349Q3d4H8mBQMxJqCY7QB","Name":"Lil Battlesnake","URL":"","Body":[{"X":1,"Y":1},{"X":1,"Y":0},{"X":0,"Y":0},{"X":0,"Y":1}],"Health":67,"Death":null,"Color":"#600080","HeadType":"beluga","TailType":"hook","Latency":"69","Shout":"","Squad":"","APIVersion":"","Author":"JeMorriso"},{"ID":"gs_gWfjdqVttw9G4hcQjHDFMRrK","Name":"caicai-vilu","URL":"","Body":[{"X":1,"Y":2},{"X":2,"Y":2},{"X":2,"Y":1},{"X":2,"Y":0},{"X":3,"Y":0},{"X":3,"Y":1},{"X":3,"Y":2},{"X":3,"Y":3},{"X":2,"Y":3},{"X":1,"Y":3},{"X":1,"Y":4}],"Health":97,"Death":{"Cause":"snake-collision","Turn":51,"EliminatedBy":"gs_TKy349Q3d4H8mBQMxJqCY7QB"},"Color":"#1974D3","HeadType":"default","TailType":"default","Latency":"67","Shout":"","Squad":"","APIVersion":"","Author":"jfgodoy"}],"Food":[{"X":7,"Y":6},{"X":0,"Y":9},{"X":4,"Y":4},{"X":8,"Y":2},{"X":8,"Y":10},{"X":5,"Y":4},{"X":7,"Y":10},{"X":3,"Y":2},{"X":0,"Y":5},{"X":9,"Y":0}],"Hazards":[]}
  const getCurrentFrame = async (input: any) => {
    const frame: Frame = formatFrame(input);
    await prefetchSvgs(frame.snakes);
    return frame;
  };

  const [currentFrame] = createResource(raw_frame, getCurrentFrame);

  return (
    <div class="bg-white p-4" style="min-width:800px">
      <h1 class="text-center font-bold text-blue-700 text-2xl">Battlesnake Tester</h1>
      <p>Learn from your own defeats</p>

      <div class="flex mt-4">
        <div class="w-2/3 m-2">
          <div class="flex justify-between">
            <p>Tests available:</p>
            <button class="bg-blue-400 text-white px-2 font-bold rounded">Run all tests</button>
          </div>
          <p class="flex items-center py-2 font-medium leading-5">
            <svg class="inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" fill="#FECDD3"></circle>
              <path d="M8 8l8 8M16 8l-8 8" stroke="#B91C1C" stroke-width="2"></path>
            </svg>
            <span>test 1</span>
          </p>

          <p class="flex items-center py-2 font-medium leading-5">
            <svg class="inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" fill="#A7F3D0"></circle>
              <path d="M18 8l-8 8-4-4" stroke="#047857" stroke-width="2"></path>
            </svg>
            <span>test 2</span>
          </p>
        </div>
        <div class="m-2">
          <div>
            <p>Test 1</p>
          </div>
          <Show when={!currentFrame.loading}>
            <Board
              game={game}
              frame={currentFrame()!}
              theme={themes.light}
              class={styles.Board}
            />
          </Show>
          <div>
            <p>Expected: Left</p>
            <p>Your Answer: Right</p>
            <button class="bg-blue-400 text-white px-2 font-bold rounded">Run Test</button>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <h3>Game importer</h3>
        <div class="flex">
          <div class="w-2/3 m-2">
            <div>
            <span>Game ID:</span>
            <input class="ml-1 bg-gray-100 round"></input>
            </div>
          </div>
          <div>
            <Show when={!currentFrame.loading}>
              <Board
                game={game}
                frame={currentFrame()!}
                theme={themes.light}
                class={styles.Board}
              />
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
