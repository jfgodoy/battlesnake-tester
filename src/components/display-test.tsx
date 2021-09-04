
import { createSignal, createMemo, createEffect, batch, Show, Switch, Match, For, JSX } from "solid-js";
import Board from "./board";
import SnakeComponent from "./snake";
import Modal from "./modal";
import { Test, TestResult, Passed, Failed, Pending, Snake } from "../model";
import { prefetchSvgs } from "../utils/render";
import { Getter, $model, onBlur } from "../solid-utils";
import * as R from "ramda";


type DisplayTestProps = {
  theme: string,
  mySnakeStyle: Getter<Pick<Snake, "color" | "headType" | "tailType"> | undefined>,
  testResult: Getter<TestResult>,
  runSingleTest: (id: string) => unknown,
  readTest: (id: string) => Promise<Test>,
  saveTest: (test: Test) => Promise<void>,
  deleteTest: (id: string) => Promise<void>,
  asCurl: (test: Test) => string,
}

export default function DisplayTest(props: DisplayTestProps): JSX.Element {
  const mySnakeStyle = props.mySnakeStyle;
  const testResult = props.testResult;

  const [selectedTest, setSelectedTest] = createSignal<Test | undefined>();
  const [displayTurn, setDisplayTurn] = createSignal(0);

  const getter = <K extends keyof Test>(prop: K) => () => {
    const test = selectedTest() || (() => { throw new Error("!"); })();
    return test[prop];
  };
  const setProp = <K extends keyof Test, V extends Test[K]>(prop: K, value: V) => {
    const test = selectedTest() || (() => { throw new Error("!"); })();
    setSelectedTest({...test, [prop]: value});
  };
  const saver = <K extends keyof Test, V extends Test[K]>(prop: K) => (value: V) => {
    setProp(prop, value);
    const test = selectedTest() || (() => { throw new Error("!"); })();
    props.saveTest(test);
  };

  createEffect(async () => {
    const testId = testResult().id;
    const test = await props.readTest(testId);
    const snakes = test.frames[0].snakes;
    await prefetchSvgs(snakes);
    const previousTest = selectedTest();
    const turn = previousTest?.id == testId ? displayTurn() : test.frameToTest;
    batch(() => {
      setDisplayTurn(turn);
      setSelectedTest(test);
    });
  });

  const selectedFrame = createMemo(() => {
    const test = selectedTest();
    const frame = test?.frames.find(fr => fr.turn == displayTurn());
    if (test && frame) {
      // use styles from config in the tested snake
      const snakes = [...frame.snakes];
      Object.assign(snakes[test.snakeToTest], mySnakeStyle());
      return {...frame, snakes};
    }
  });

  const snakesSortedByDeath = createMemo(() => {
    const test = selectedTest();
    const frame = selectedFrame();
    if (test && frame) {
      const frames = test.frames;
      const lastFrame = frames[frames.length - 1];
      const deaths = lastFrame.snakes.map(s => s.death ? s.death.turn : lastFrame.turn + 1);
      const pairs = R.zip(frame.snakes, deaths);
      const sortedPairs = R.sortBy(pair => -pair[1], pairs);
      return sortedPairs.map(pair => pair[0]);
    }
    return [];
  });

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
  };

  const FormattedAnswer = (props: {testResult: TestResult }) => {
    const result = createMemo(() => props.testResult.result);
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
  };

  const [showMenu, setMenu] = createSignal(false);
  const handleAction = <T extends Array<unknown>>(fn: (...args: T) => void, ...args: T): (() => void) => {
    return () => {
      setMenu(false);
      fn(...args);
    };
  };

  const [showCurl, setShowCurl] = createSignal(false);

  return (
    <div class="flex flex-col m-4 bg-white">
      <Show when={selectedTest()}>
        {(test) => <>
          <div style="border-bottom:1px solid rgba(210,221,234,.5)" class="flex items-center justify-between px-4 py-4">
            <input
              type="text"
              value={test.description}
              class="border border-opacity-0 border-gray-300 rounded hover:border-opacity-100 cursor-default hover:cursor-text focus-within:cursor-text w-full overflow-ellipsis"
              use:$model={onBlur(getter("description"), saver("description"))}
              onkeydown={(e) => { if (e.key == "Enter") {(e.target as HTMLInputElement).blur(); }  }}
            />
            <div class="relative">
              <button onclick={() => setMenu(!showMenu())} class="relative block rounded-md bg-white p-2 ml-1 border border-white hover:border-gray-200 focus:outline-none">
                <IconFeatherMoreVertical class="text-gray-500" />
              </button>

              <Show when={showMenu()}>
                <div onclick={() => setMenu(false)} class="fixed inset-0 h-full w-full z-10"></div>
                <div class="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-md z-20 border border-gray-100">
                  <button onclick={() => {setShowCurl(true); setMenu(false);}} class="block w-full text-left px-4 py-2 text-sm capitalize text-gray-700 hover:bg-yellow-100">
                    export as curl
                  </button>
                  <button onclick={handleAction(props.deleteTest, test.id)} class="block w-full text-left px-4 py-2 text-sm capitalize text-red-700 hover:bg-yellow-100">
                    delete
                  </button>
                </div>
              </Show>
            </div>
          </div>
          <div class="flex items-start flex-wrap p-4">
            <div class="inline-block">
              <Show when={selectedFrame()}>
                {(frame) =>
                  <Board
                    game={test.game}
                    frame={frame}
                    theme={props.theme}
                  />
                }
              </Show>
              <div>
                <span>turn:</span><input class="py-0 w-24 text-center focus:ring-0 border-none" type="number" value={displayTurn()} onInput={(e) => handleDisplayTurn(e)} />
              </div>
            </div>
            <table>
              <For each={snakesSortedByDeath()}>
                {(snake) => (
                  <tr class="" style={{opacity: snake.death ? 0.2 : 1}}>
                    <td class="pr-2 py-1" style="font-size:0"><SnakeComponent color={snake.color} head={snake.headType} tail={snake.tailType}/></td>
                    <td class="text-right tabular-nums">{snake.body.length}</td>
                    <td><IconElResizeHorizontal class="text-gray-500"/></td>
                    <td class="text-right tabular-nums w-10">{snake.health}</td>
                    <td><IconClarityHeartSolid class="text-red-500" /></td>
                  </tr>
                )}
              </For>
            </table>
          </div>
          <div class="p-4">
            <p>Expected: {test.expectedResult.join(" or ") }</p>
            <p>Your Answer: <FormattedAnswer testResult={testResult()} /> </p>
            <button class="bg-blue-400 text-white mt-2 px-2 font-bold rounded" onclick={() => props.runSingleTest(test.id)}>Run Test</button>
          </div>
          <Modal title="Export as curl" switch={[showCurl, setShowCurl]}>
            <div class="flex-1 p-4">{() => <textarea readonly class="w-full h-full border-gray-200">{props.asCurl(selectedTest()!)}</textarea> }</div>
          </Modal>
        </>}
      </Show>
    </div>
  );
}
