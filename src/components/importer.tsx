import { createMemo, For, Show } from "solid-js";
import { createStore, $RAW } from "solid-js/store";
import { nanoid } from "nanoid";
import { Game, Frame, DirectionStr, Test } from "../model";
import { importGame } from "../core/importer";
import { prefetchSvgs } from "../utils/render";
import { runTest } from "../core/tester";
import { Getter, Setter } from "../solid-utils";
import Board from "./board";

export default function Importer(props: { server: Getter<string>, saveTest: Setter<Test>, theme: string }) {
  const [state, setState] = createStore({
    gameId: "",
    frameToTest: 0,
    game: undefined as Game | undefined,
    frames: [] as Frame[],
    snakeToTest: 0,
    description: "",
    expectedResult: [] as DirectionStr[],
    testAnswer: "",
  });
  const setExpectedResult = (val: DirectionStr[]) => setState("expectedResult", val);

  const doImport = async () => {
    const res = await importGame(state.gameId);
    const firstFrame = res.frames[0]!;
    await prefetchSvgs(firstFrame.snakes);
    setState({game: res.game, frames: res.frames, frameToTest: 0, description: "", snakeToTest: 0, expectedResult: [], testAnswer: ""})
  }

  function handleFrameToTest(e: Event) {
    const el = e.target as HTMLInputElement;
    const value = el.value.trim() != "" ? +el.value : 0;
    const frames_len = state.frames.length;
    const new_val = Math.max(0, Math.min(value, frames_len -1));
    el.value = el.value.trim() != "" ? new_val.toString() : "";
    setState("frameToTest", new_val);
  }

  function handleSnakeSelector(e: Event) {
    const el = e.target as HTMLInputElement;
    if (el.checked) {
      setState("snakeToTest", +el.value);
    }
  }

  const snakesAvailable = createMemo((): {name: string, deathInfo: string, isDeathNow: boolean}[] => {
    if (state.frames.length > 0) {
      const currentFrameSnakes = state.frames[state.frameToTest]!.snakes;
      const lastFrameSnakes = state.frames[state.frames.length - 1]!.snakes;
      const res = [];
      for (let i = 0; i < currentFrameSnakes.length; i++) {
        res.push({
          name: currentFrameSnakes[i]!.name,
          deathInfo: lastFrameSnakes[i]!.death ? `rip in turn ${lastFrameSnakes[i]!.death!.turn}` : "winner",
          isDeathNow: !!currentFrameSnakes[i]!.death,
        })
      }
      return res;
    }
    return [];
  });

  const prepareTest = (): Test | undefined => {
    const data = state[$RAW]!;
    const game = data.game;
    const frames = data.frames;
    const snakeToTest = data.snakeToTest;
    if (game && frames && snakeToTest >= 0) {
      let lastFrame = frames[frames.length - 1]!;
      let snake = lastFrame.snakes[snakeToTest]!;
      let death = snake.death && snake.death.turn || lastFrame.turn;
      return {
        id: nanoid(10),
        description: data.description,
        timestamp: Date.now(),
        game: game,
        frames: frames.filter(fr => fr.turn >= data.frameToTest &&  fr.turn <= death),
        frameToTest: data.frameToTest,
        snakeToTest: data.snakeToTest,
        expectedResult: data.expectedResult,
      }
    }
  };


  const runSingleTest = async () => {
    let test = prepareTest();
    if (test) {
      const res = await runTest(`${props.server()}/move`, test);
      setState("testAnswer", res.move || res.msg);
    }
  }

  const saveTest = () => {
    const test = prepareTest();
    if (test) {
      props.saveTest(test);
    }
  }

  const RadioDirections = (props: {options: DirectionStr[], items: Getter<DirectionStr[]>, setItems: (items: DirectionStr[]) => void, }) => {
    const checked = createMemo(() => {
      const array = props.items().map(v => false);
      props.items().forEach(item => {
        const idx = props.options.findIndex(option => option == item);
        if (idx >= 0) {
          array[idx] = true;
        }
      });
      return array;
    });

    const isChecked = (i: number) => checked()[i];
    const toggle = (i: number) => {
      const array = checked();
      array[i] = !array[i];
      const directions = props.options.filter((_, i) => array[i])
      props.setItems(directions);
    }

    return (
      <For each={props.options}>
        {(item, i) => <><label><input type="checkbox" value={item} checked={isChecked(i())} onChange={() => toggle(i())} />{item.toLowerCase()}</label><br /></>}
      </For>
    );
  }



  return (
    <div class="m-4 p-4 bg-white">
      <h3 class="text-lg text-gray-700">Game importer</h3>
      <div class="flex my-4">
        <div class="space-y-2">
          <Show when={!state.game}>
          <div>
            <span>Game ID:</span>
            <input class="py-0 rounded border-gray-400 mx-2" type="text" value={state.gameId} onBlur={(e) => setState("gameId", (e.target as HTMLInputElement).value)} />
            <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={() => doImport()}>Import game</button>
          </div>
          </Show>
          <Show when={state.game}>
          <div>
            <span class="inline-block w-1/3">test description:</span>
            <input class="inline-block w-3/6 py-0 rounded border-gray-400 ml-2" type="text" value={state.description} onBlur={(e) => setState("description", (e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <span class="inline-block w-1/3">frame to test:</span>
            <input class="inline-block w-3/6 py-0 rounded border-gray-400 ml-2" type="number" value={state.frameToTest} onInput={(e) => handleFrameToTest(e)} />
          </div>
          <div>
            <span>snake to test:</span><br />
            <For each={snakesAvailable()}>{(snakeInfo, i) => <>
              <label style={{opacity: snakeInfo.isDeathNow ? 0.4 : 1}}>
                <input
                  type="radio"
                  name="snakeToTest"
                  value={i()}
                  checked={state.snakeToTest == i()}
                  disabled={snakeInfo.isDeathNow}
                  onChange={e => handleSnakeSelector(e)}
                />
                {snakeInfo.name} ({snakeInfo.deathInfo})
              </label>
              <br />
            </>}</For>
          </div>
          <div>
            <span>expected direction(s):</span><br />
            <RadioDirections options={["Up", "Down", "Left", "Right"]} items={() => state.expectedResult} setItems={setExpectedResult} />
          </div>
          <Show when={state.testAnswer}>
            <div>
              <span>your answer: {state.testAnswer} </span>
            </div>
          </Show>
          <div>
            <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={() => runSingleTest()}>Run test</button>
            <button class="bg-blue-400 text-white px-2 ml-2 font-bold rounded" onclick={() => saveTest()}>Save test</button>
          </div>
          </Show>
        </div>
        <div>
          <Show when={state.game}>
            <Board
              game={state.game!}
              frame={state.frames[state.frameToTest]!}
              theme={props.theme}
            />
          </Show>
        </div>
      </div>
    </div>
  );
}
