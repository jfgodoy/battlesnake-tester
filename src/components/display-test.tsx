
import { createSignal, createMemo, createEffect, batch, Show, Switch, Match, For, JSX } from "solid-js";
import Board from "./board";
import SnakeComponent from "./snake";
import { Test, TestResult, Passed, Failed, Pending } from "../model";
import { prefetchSvgs } from "../utils/render";
import { Getter } from "../solid-utils";
import * as R from "ramda";


type DisplayTestProps = {
  theme: string,
  mySnakeStyle: Getter<{color: string, head: string, tail: string} | undefined>,
  testResult: Getter<TestResult>,
  runSingleTest: (id: string) => unknown,
  readTest: (id: string) => Promise<Test>,
}

export default function DisplayTest(props: DisplayTestProps): JSX.Element {
  const mySnakeStyle = props.mySnakeStyle;
  const testResult = props.testResult;

  const [selectedTest, setSelectedTest] = createSignal(null as Test | null);
  const [displayTurn, setDisplayTurn] = createSignal(0);

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

  return (
    <div class="flex flex-col m-4 p-4 bg-white">
      <Show when={selectedTest()}>
        {(test) => <>
          <div class="my-2">
            <h3 class="text-lg text-gray-700">{test.description}</h3>
          </div>
          <div class="flex items-start flex-wrap">
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
                    <td>length:</td>
                    <td class="px-2 text-right tabular-nums">{snake.body.length}</td>
                    <td>health:</td>
                    <td class="text-right tabular-nums w-10">{snake.health}</td>
                  </tr>
                )}
              </For>
            </table>
          </div>
          <div>
            <p>Expected: {test.expectedResult.join(" or ") }</p>
            <p>Your Answer: <FormattedAnswer testResult={testResult()} /> </p>
            <button class="bg-blue-400 text-white my-2 px-2 font-bold rounded" onclick={() => props.runSingleTest(test.id)}>Run Test</button>
          </div>
        </>}
      </Show>
    </div>
  );
}
