import { Component, Show, createMemo, createSignal, For, Switch, Match, createSelector } from "solid-js";
import type { Accessor } from "solid-js";
import { createStore } from "solid-js/store";

import styles from "./App.module.css";
import Board from "./components/board";

import { themes } from "./theme";
import { prefetchSvgs } from "./utils/render";
import { Passed, Failed, Pending, runTest } from "./utils/tester";
import { Test} from "./model";

import { indexdbTestStore, TestPreview } from "./test-store";

const testStorage = indexdbTestStore();


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


  const loadTest = async (index: number) => {
    const testId = state.testResults[index].id;
    const test = await testStorage.read(testId);
    const snakes = test.frames[0].snakes;
    await prefetchSvgs(snakes);
    setState("selected", index);
    setSelectedTest(test);
  }

  testStorage.list().then(tests => {
    const testResults: TestResult[] = tests.map(preview => ({...preview, result: {type: "pending"}}));
    setState("testResults", testResults);
    loadTest(state.selected);
  })

  const runAllTests = async() => {
    const promises = state.testResults
      .map(t => t.id)
      .map(id => testStorage.read(id))
      .map(testPromise => testPromise.then(test => runTest("http://localhost:8080/move", test)));

    const results = await Promise.all(promises);
    setState("testResults", state.testResults.map((t, i) => ({...t, result: results[i]})));
  }

  const runSingleTest = async () => {
    let test = selectedTest();
    if (test) {
      const res = await runTest("http://localhost:8080/move", test);
      setState("testResults", state.selected, "result", res);
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
            <Board
              game={test.game}
              frame={test.frames.find(fr => fr.turn == test.frameToTest)!}
              theme={themes.light}
              class={styles.Board}
            />
            <div>
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

  return (
    <div class="bg-white p-4" style="min-width:800px">
      <h1 class="text-center font-bold text-blue-700 text-2xl">Battlesnake Tester</h1>
      <p>Learn from your own defeats</p>

      <TestList />

      {/* <div class="mt-4">
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
      </div> */}
    </div>
  );
};

export default App;
