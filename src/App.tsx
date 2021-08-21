import { Component, Show, createMemo, createSignal, For, Switch, Match, createSelector, createEffect, batch } from "solid-js";
import type { Accessor } from "solid-js";
import { createStore, $RAW } from "solid-js/store";
import { nanoid } from "nanoid";

import styles from "./App.module.css";
import Board from "./components/board";
import Snake from "./components/snake";

import { themes } from "./theme";
import { prefetchSvgs } from "./utils/render";
import { Passed, Failed, Pending, runTest } from "./utils/tester";
import { Game, Frame, Test, DirectionStr } from "./model";
import { importGame } from "./utils/importer";

import { indexdbTestStore, TestPreview } from "./test-store";
import * as R from "ramda";

const testStorage = indexdbTestStore();
const [config, setConfig] = createStore({
  server: "http://localhost:8080",
  testedSnake: {
    style: null as {color: string, head: string, tail: string} | null,
  },
});


const Config = () => {
  createEffect(async function fetchSnake() {
    setConfig("testedSnake", "style", null);
    const resp = await fetch(config.server).then(res => res.json());
    const {color, head, tail} = resp;
    setConfig("testedSnake", "style", {color, head, tail});
  });

  return (
    <div class="flex items-center mt-2">
      <span>Server:</span>
      <input class="ml-1 px-2 rounded bg-gray-100 round" value={config.server} onBlur={(e) => setConfig("server", (e.target as HTMLInputElement).value)} />
      <Show when={config.testedSnake.style}>
        {(s) => <Snake class="mx-2" color={s.color} head={s.head} tail={s.tail} />}
      </Show>
    </div>
  );
}


const TestList = () => {
  interface TestResult extends TestPreview {
    result: Passed | Failed | Pending
  };
  const [state, setState] = createStore({
    testResults: [] as TestResult[],
    selected: 0,
  });

  const testResult = createMemo(() => state.testResults[state.selected]);
  const isSelected = createSelector(() => state.selected);

  const [selectedTest, setSelectedTest] = createSignal(null as Test | null);
  const [displayTurn, setDisplayTurn] = createSignal(0);

  const selectedFrame = createMemo(() => {
    const test = selectedTest();
    if (test) {
      let frame = test.frames.find(fr => fr.turn == displayTurn())!;

      // use styles from config in the tested snake
      let snakes = frame.snakes.map((s, i) => {
        if (i == test.snakeToTest) {
          return {...s, ...config.testedSnake.style};
        }
        return s;
      });

      return {...frame, snakes};
    }
  });

  const snakesSortedByDeath = createMemo(() => {
    const frame = selectedFrame();
    if (frame) {
      const frames = selectedTest()!.frames;
      const lastFrame = frames[frames.length - 1];
      const deaths = lastFrame.snakes.map(s => s.death ? s.death.turn : lastFrame.turn + 1);
      const pairs = R.zip(frame.snakes, deaths);
      const sortedPairs = R.sortBy(pair => -pair[1], pairs);
      return sortedPairs.map(pair => pair[0]);
    }
    return [];
  })


  const loadTest = async (index: number) => {
    const testId = state.testResults[index].id;
    const test = await testStorage.read(testId);
    const snakes = test.frames[0].snakes;
    await prefetchSvgs(snakes);
    batch(() => {
      setDisplayTurn(test.frameToTest);
      setState("selected", index);
      setSelectedTest(test);
    });
  }

  testStorage.list().then(tests => {
    const testResults: TestResult[] = tests.map(preview => ({...preview, result: {type: "pending"}}));
    setState("testResults", testResults);
    loadTest(state.selected);
  })

  testStorage.suscribe((before, after) => {
    if (!before && after) {
      // added
      const testResult: TestResult = {
        id: after.id,
        description: after.description,
        timestamp: after.timestamp,
        result: {type: "pending"},
      };
      setState("testResults", l => [...l, testResult]);
      loadTest(state.testResults.length - 1);
    }
  })

  const runAllTests = async() => {
    const promises = state.testResults
      .map(t => t.id)
      .map(id => testStorage.read(id))
      .map(testPromise => testPromise.then(test => runTest(`${config.server}/move`, test)));

    const results = await Promise.all(promises);
    setState("testResults", state.testResults.map((t, i) => ({...t, result: results[i]})));
  }

  const runSingleTest = async () => {
    let test = selectedTest();
    if (test) {
      const res = await runTest(`${config.server}/move`, test);
      setState("testResults", state.selected, "result", res);
    }
  }


  const handleDisplayTurn = (e: Event) => {
    const test = selectedTest();
    if (test) {
      const el = e.target as HTMLInputElement;
      const value = el.value.trim() != "" ? +el.value : 0;
      const firstTurn = test.frames[0].turn;
      const lastFrame = test.frames[test.frames.length - 1];
      const lastTurn = lastFrame.turn;
      const new_val = Math.max(firstTurn, Math.min(value, lastTurn));
      el.value = el.value.trim() != "" ? new_val.toString() : "";
      setDisplayTurn(new_val);
    }
  }


  const FormattedAnswer = (props: {testResult: Accessor<TestResult> }) => {
    const result = createMemo(() => props.testResult().result);
    function matches<S extends T, T=unknown>(e:T, predicate:((e:T) => e is S)):S|false {
      return predicate(e) ? e : false;
    }
    const isPassed = (e: Passed | Failed | Pending):e is Passed => e.type == "passed";
    const isFailed = (e: Passed | Failed | Pending):e is Failed => e.type == "failed";
    const isPending = (e: Passed | Failed | Pending):e is Pending => e.type == "pending";
    return (
      <Switch>
        <Match when={matches(result(), isPending)}>
          <span></span>
        </Match>
        <Match when={matches(result(), isPassed)}>
          {(item) => <span style="color:green">{item.move}</span>}
        </Match>
        <Match when={matches(result(), isFailed)}>
          {(item) => <span style="color:red">{item.move || item.msg}</span>}
        </Match>
      </Switch>
    );
  }



  return (
    <div class="flex mt-4">
      <div class="w-2/3 m-2">
        <div class="flex justify-between">
          <p>Tests available:</p>
          <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={() => runAllTests()}>Run all tests</button>
        </div>
        <ul class="max-h-96 overflow-y-scroll">
          <For each={state.testResults}>
            {(tr, i) => (
              <li class="flex items-center px-2 py-2 font-medium leading-5" classList={{ "bg-yellow-100": isSelected(i()) }} onclick={() => loadTest(i())}>
                <Switch>
                  <Match when={tr.result.type == "pending"}>
                    <svg class="inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill="#D9D9D9"></circle>
                    </svg>
                  </Match>
                  <Match when={tr.result.type === "passed"}>
                    <svg class="inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill="#A7F3D0"></circle>
                      <path d="M18 8l-8 8-4-4" stroke="#047857" stroke-width="2"></path>
                    </svg>
                  </Match>
                  <Match when={tr.result.type === "failed"}>
                    <svg class="inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill="#FECDD3"></circle>
                      <path d="M8 8l8 8M16 8l-8 8" stroke="#B91C1C" stroke-width="2"></path>
                    </svg>
                  </Match>
                </Switch>
                <span>{tr.description}</span>
              </li>
            )}
          </For>
        </ul>
      </div>
      <div class="m-2">
        <Show when={selectedTest()}>
          {(test) => <>
            <div>
              <p>{test.description}</p>
            </div>
            <div>
              <Board
                game={test.game}
                frame={selectedFrame()!}
                theme={themes.light}
                class={styles.Board}
              />
              <div>
                <span>turn:</span><input type="number" value={test.frameToTest} onInput={(e) => handleDisplayTurn(e)} />
              </div>
            </div>
            <div>
                <table>
              <For each={snakesSortedByDeath()}>
                {(snake) => (
                  <tr class="" style={{opacity: snake.death ? 0.2 : 1}}>
                    <td class="pr-2 py-1" style="font-size:0"><Snake color={snake.color} head={snake.headType} tail={snake.tailType}/></td>
                    <td>length:</td>
                    <td class="px-2 text-right tabular-nums">{snake.body.length}</td>
                    <td>health:</td>
                    <td class="px-2 text-right tabular-nums">{snake.health}</td>
                  </tr>
                )}
              </For>
                </table>
              <p>Expected: {test.expectedResult.join(" or ") }</p>
              <p>Your Answer: <FormattedAnswer testResult={testResult} /> </p>
              <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={() => runSingleTest()}>Run Test</button>
            </div>
          </>}
        </Show>
      </div>
    </div>
  );
}

const Importer = () => {
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
    const firstFrame = res.frames[0];
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

  const snakeNames = createMemo((): string[] => {
    if (state.frames.length > 0) {
      const lastFrame: Frame = state.frames[state.frames.length - 1];
      return lastFrame.snakes.map(s => {
        const info = s.death ? `(rip in turn ${s.death.turn})` : `(winner)`;
        return s.name + ' ' + info;
      });
    }
    return [];
  })

  const prepareTest = (): Test | undefined => {
    const data = state[$RAW]!;
    const game = data.game;
    const frames = data.frames;
    const snakeToTest = data.snakeToTest;
    if (game && frames && snakeToTest >= 0) {
      let lastFrame = frames[frames.length - 1];
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
      const res = await runTest(`${config.server}/move`, test);
      setState("testAnswer", res.move || res.msg);
    }
  }

  const saveTest = () => {
    const test = prepareTest();
    if (test) {
      testStorage.save(test);
    }
  }

  const RadioDirections = (props: {options: DirectionStr[], items: Accessor<DirectionStr[]>, setItems: (items: DirectionStr[]) => void, }) => {
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
    <div class="mt-4">
      <h3>Game importer</h3>
      <div class="flex">
        <div class="w-2/3 m-2">
          <div>
            <span>Game ID:</span>
            <input class="ml-1 bg-gray-100 round" value={state.gameId} onBlur={(e) => setState("gameId", (e.target as HTMLInputElement).value)} />
            <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={() => doImport()}>Import game</button>
          </div>
          <div>
            <span>test description:</span><input type="text" value={state.description} onBlur={(e) => setState("description", (e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <span>frame to test:</span><input type="number" value={state.frameToTest} onInput={(e) => handleFrameToTest(e)} />
          </div>
          <div>
            <span>snake to test:</span><br />
            <For each={snakeNames()}>{(snakeName, i) => <>
              <label><input type="radio" name="snakeToTest" value={i()} checked={state.snakeToTest == i()} onChange={e => handleSnakeSelector(e)} />{snakeName}</label><br />
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
        </div>
        <div>
          <Show when={state.game}>
            <Board
              game={state.game!}
              frame={state.frames[state.frameToTest]}
              theme={themes.light}
              class={styles.Board}
            />
          </Show>
        </div>
      </div>
    </div>
  );
}

const App: Component = () => {

  return (
    <div class="bg-white p-4" style="min-width:800px">
      <h1 class="text-center font-bold text-blue-700 text-2xl">Battlesnake Tester</h1>
      <p>Learn from your own defeats</p>
      <Config />
      <TestList />
      <Importer />
    </div>
  );
};

export default App;
