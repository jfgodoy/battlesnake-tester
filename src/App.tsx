import { Component, Show, createMemo, createSignal, For, Switch, Match, createSelector, batch, createEffect } from "solid-js";
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

interface TestResult extends TestPreview {
  result: Passed | Failed | Pending
};
const [state, setState] = createStore({
  testResults: [] as TestResult[],
  selected: 0,
  view: "test",
});


function loadState() {
  testStorage.list().then(tests => {
    const testResults: TestResult[] = tests.map(preview => ({...preview, result: {type: "pending"}}));
    setState("testResults", testResults);
  });

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
    }
  });
}
loadState();



const TestList = () => {
  const isSelected = createSelector(() => state.selected);
  const loadTest = (index: number) => {
    setState({selected: index, view: "test"});
  };

  const runAllTests = async() => {
    const promises = state.testResults
      .map(t => t.id)
      .map(id => testStorage.read(id))
      .map(testPromise => testPromise.then(test => runTest(`${config.server}/move`, test)));

    const results = await Promise.all(promises);
    setState("testResults", state.testResults.map((t, i) => ({...t, result: results[i]})));
  }

  return (
    <div class="flex flex-col w-full">
      <div class="flex flex-0 justify-between mb-4">
        <p class="font-bold text-gray-500">Tests available:</p>
        <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={() => runAllTests()}>Run all tests</button>
      </div>
      <div class="overflow-y-scroll">
        <ul>
          <For each={state.testResults}>
            {(tr, i) => (
              <li class="flex items-center px-2 py-2 font-medium leading-5" classList={{ "bg-yellow-100": isSelected(i()) }} onclick={() => loadTest(i())}>
                <Switch>
                  <Match when={tr.result.type == "pending"}>
                    <svg class="flex-shrink-0 inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill="#D9D9D9"></circle>
                    </svg>
                  </Match>
                  <Match when={tr.result.type === "passed"}>
                    <svg class="flex-shrink-0 inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill="#A7F3D0"></circle>
                      <path d="M18 8l-8 8-4-4" stroke="#047857" stroke-width="2"></path>
                    </svg>
                  </Match>
                  <Match when={tr.result.type === "failed"}>
                    <svg class="flex-shrink-0 inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill="#FECDD3"></circle>
                      <path d="M8 8l8 8M16 8l-8 8" stroke="#B91C1C" stroke-width="2"></path>
                    </svg>
                  </Match>
                </Switch>
                <span class="truncate">{tr.description}</span>
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  );
}


const DisplayTest = () => {
  const [selectedTest, setSelectedTest] = createSignal(null as Test | null);
  const [displayTurn, setDisplayTurn] = createSignal(0);
  const testResult = createMemo(() => state.testResults[state.selected]);
  const selectedFrame = createMemo(() => {
    const test = selectedTest();
    if (test) {
      const frame = test.frames.find(fr => fr.turn == displayTurn())!;

      // use styles from config in the tested snake
      const snakes = frame.snakes.map((s, i) => {
        if (i == test.snakeToTest) {
          return {...s, ...config.testedSnake.style};
        }
        return s;
      });

      return {...frame, snakes};
    }
  });

  createEffect(async () => {
    if (!testResult()) {
      setSelectedTest(null);
      return;
    }
    const testId = testResult().id;
    const test = await testStorage.read(testId);
    const snakes = test.frames[0].snakes;
    await prefetchSvgs(snakes);
    batch(() => {
      setDisplayTurn(test.frameToTest);
      setSelectedTest(test);
    });
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
    <div class="flex flex-col m-4 p-4 bg-white">
      <Show when={selectedTest()}>
        {(test) => <>
          <div class="my-2">
            <h3 class="text-lg text-gray-700">{test.description}</h3>
          </div>
          <div class="flex items-start flex-wrap">
            <div class="inline-block">
              <Board
                game={test.game}
                frame={selectedFrame()!}
                theme={themes.light}
              />
              <div>
                <span>turn:</span><input class="py-0 w-24 text-center focus:ring-0 border-none" type="number" value={test.frameToTest} onInput={(e) => handleDisplayTurn(e)} />
              </div>
            </div>
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
          </div>
          <div>
            <p>Expected: {test.expectedResult.join(" or ") }</p>
            <p>Your Answer: <FormattedAnswer testResult={testResult} /> </p>
            <button class="bg-blue-400 text-white my-2 px-2 font-bold rounded" onclick={() => runSingleTest()}>Run Test</button>
          </div>
        </>}
      </Show>
    </div>
  );
}


const App: Component = () => {
  const [server, setServer] = signalFromStore(config, setConfig, "server");
  const [view, setView] = signalFromStore(state, setState, "view");


  return (
    <div class="flex flex-col h-screen">
      <header>
        <div class="p-4" style="background-color:#72268c;">
          <h1 class="text-center text-white text-2xl font-semibold tracking-wide">Battlesnake Tester</h1>
        </div>
        <div class="p-4 bg-white" style="box-shadow:0 1px 1px 1px rgb(18 106 211 / 8%);" >
          <ConfigComponent server={[server, setServer]} style={signalFromStore(config, setConfig, "testedSnake.style")} setView={setView} />
        </div>
      </header>
      <div class="flex flex-1 flex-row mt-1 overflow-hidden">
        <aside class="flex bg-white w-80 p-4">
          <TestList />
        </aside>
        <main class="flex-1 p-4">
          <div class="flex">
            <Switch>
              <Match when={state.view == "test"}>
                <DisplayTest />
              </Match>
              <Match when={state.view == "importer"}>
                <ImporterComponent server={server} saveTest={test => testStorage.save(test)} theme={themes.light}/>
              </Match>
            </Switch>
          </div>
        </main>
      </div>
    </div>
  )
};

export default App;
