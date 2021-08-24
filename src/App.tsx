import { Component, Show, createMemo, createSignal, For, Switch, Match, createSelector, batch } from "solid-js";
import type { Accessor } from "solid-js";
import { createStore } from "solid-js/store";

import Board from "./components/board";
import SnakeComponent from "./components/snake";
import ConfigComponent from "./components/config";
import ImporterComponent from "./components/importer";

import { themes } from "./theme";
import { prefetchSvgs } from "./utils/render";
import { Passed, Failed, Pending, runTest } from "./utils/tester";
import { Test } from "./model";


import { indexdbTestStore, TestPreview } from "./test-store";
import * as R from "ramda";
import { signalFromStore, autoresize, model, useDirective} from "./solid-utils";

useDirective(autoresize);
useDirective(model);


const testStorage = indexdbTestStore();
const [config, setConfig] = createStore({
  server: "http://localhost:8080",
  testedSnake: {
    style: null as {color: string, head: string, tail: string} | null,
  },
});




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
                    <td class="pr-2 py-1" style="font-size:0"><SnakeComponent color={snake.color} head={snake.headType} tail={snake.tailType}/></td>
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


const App: Component = () => {
  const [server, setServer] = signalFromStore(config, setConfig, "server");

  return (<>
    <div class="p-4" style="background-color:#72268c;">
      <h1 class="text-center text-white text-2xl font-semibold tracking-wide">Battlesnake Tester</h1>
    </div>
    <div class="p-4 mb-4 bg-white" style="box-shadow:0 1px 1px 1px rgb(18 106 211 / 8%);" >
      <ConfigComponent server={[server, setServer]} style={signalFromStore(config, setConfig, "testedSnake.style")} />
    </div>
    <div class="bg-white p-4" style="min-width:800px">
      <p>Learn from your own defeats</p>
      <TestList />
      <ImporterComponent server={server} saveTest={test => testStorage.save(test)} theme={themes.light}/>
    </div>
  </>);
};

export default App;
