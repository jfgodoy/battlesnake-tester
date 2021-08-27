
import { createSignal, createMemo, createEffect, batch, Show, Switch, Match, For } from "solid-js"
import type { Accessor } from "solid-js";
import Board from "./board";
import SnakeComponent from "./snake";
import { Test, TestResult, Passed, Failed, Pending } from "../model";
import { prefetchSvgs } from "../utils/render";
import { Signal, Getter, Setter } from "../solid-utils";
import * as R from "ramda";

type DisplayTestProps = {
  theme: string,
  mySnakeStyle: Getter<{color: string, head: string, tail: string} | null>,
  testResult: Getter<TestResult | undefined>,
  runSingleTest: (id: string) => any,
  readTest: (id: string) => Promise<Test>,
}

export default function DisplayTest(props: DisplayTestProps) {
  const mySnakeStyle = props.mySnakeStyle;
  const testResult = props.testResult;

  const [selectedTest, setSelectedTest] = createSignal(null as Test | null);
  const [displayTurn, setDisplayTurn] = createSignal(0);

  const selectedFrame = createMemo(() => {
    const test = selectedTest();
    if (test) {
      const frame = test.frames.find(fr => fr.turn == displayTurn())!;

      // use styles from config in the tested snake
      const snakes = frame.snakes.map((s, i) => {
        if (i == test.snakeToTest) {
          return {...s, ...mySnakeStyle()};
        }
        return s;
      });

      return {...frame, snakes};
    }
  });

  createEffect(async () => {
    const tr = testResult();
    if (!tr) {
      setSelectedTest(null);
      return;
    }
    const testId = tr.id;
    const test = await props.readTest(testId);
    const snakes = test.frames[0]!.snakes;
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
      const lastFrame = frames[frames.length - 1]!;
      const deaths = lastFrame.snakes.map(s => s.death ? s.death.turn : lastFrame.turn + 1);
      const pairs = R.zip(frame.snakes, deaths);
      const sortedPairs = R.sortBy(pair => -pair[1], pairs);
      return sortedPairs.map(pair => pair[0]);
    }
    return [];
  })

  const handleDisplayTurn = (e: Event) => {
    const test = selectedTest();
    if (test) {
      const el = e.target as HTMLInputElement;
      const value = el.value.trim() != "" ? +el.value : 0;
      const firstTurn = test.frames[0]!.turn;
      const lastFrame = test.frames[test.frames.length - 1]!;
      const lastTurn = lastFrame.turn;
      const new_val = Math.max(firstTurn, Math.min(value, lastTurn));
      el.value = el.value.trim() != "" ? new_val.toString() : "";
      setDisplayTurn(new_val);
    }
  }

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
                theme={props.theme}
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
            <p>Your Answer: <FormattedAnswer testResult={testResult()!} /> </p>
            <button class="bg-blue-400 text-white my-2 px-2 font-bold rounded" onclick={() => props.runSingleTest(test.id)}>Run Test</button>
          </div>
        </>}
      </Show>
    </div>
  );
}
