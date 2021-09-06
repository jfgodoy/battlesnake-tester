
import { createSignal, createMemo, createEffect, batch, Show, For, JSX } from "solid-js";
import Board from "./board";
import SnakeComponent from "./snake";
import Modal from "./modal";
import { Test, TestResult, Snake, DirectionStr, Passed, Failed } from "../model";
import { prefetchSvgs } from "../utils/render";
import { Getter, $model, onBlur } from "../solid-utils";
import * as R from "ramda";
import { nanoid } from "nanoid";


type DisplayTestProps = {
  mySnakeStyle: Getter<Pick<Snake, "color" | "headType" | "tailType"> | undefined>,
  testResult: Getter<TestResult>,
  runSingleTest: (id: string) => unknown,
  runUnsavedTest: (test: Test) => Promise<Passed | Failed>,
  readTest: (id: string) => Promise<Test>,
  saveTest: (test: Test) => Promise<void>,
  deleteTest: (id: string) => Promise<void>,
  asCurl: (test: Test) => string,
  asJson: (test: Test) => string,
}

export default function DisplayTest(props: DisplayTestProps): JSX.Element {
  const mySnakeStyle = props.mySnakeStyle;
  const testResult = props.testResult;

  const [selectedTest, setSelectedTest] = createSignal<Test | undefined>();
  const [displayTurn, setDisplayTurn] = createSignal(0);
  const [temporalTest, setTemporalTest] = createSignal<{turn: number, move?: DirectionStr, msg?: string} | undefined>();

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
      setTemporalTest(undefined);
    });
  });

  const selectedFrame = createMemo(() => {
    const test = selectedTest();
    const frame = test?.frames.find(fr => fr.turn == displayTurn());
    if (test && frame) {
      // use styles from config in the tested snake
      const snakes = frame.snakes.map(s => ({...s}));
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
      const snakes: Array<Snake & {idx: number}> = frame.snakes.map((s, i) => ({...s, idx: i}));
      const pairs = R.zip(snakes, deaths);
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

  const [showMenu, setMenu] = createSignal(false);
  const handleAction = <T extends Array<unknown>>(fn: (...args: T) => void, ...args: T): (() => void) => {
    return () => {
      setMenu(false);
      fn(...args);
    };
  };

  const [showCurl, setShowCurl] = createSignal(false);
  const [showJson, setShowJson] = createSignal(false);

  const isOkAnswer = (dir: DirectionStr) => {
    const tr = testResult();
    return tr.result.type == "passed" && tr.result.move == dir;
  };

  const isWrongAnswer = (dir: DirectionStr) => {
    const tr = testResult();
    return tr.result.type == "failed" && tr.result.move == dir;
  };

  const failedMsg = () => {
    const tr = testResult();
    return (tr.result.type == "failed" && !tr.result.move) ? tr.result.msg : "";
  };

  const toggleDir = (dir: DirectionStr) => () => {
    const test = selectedTest() || (() => { throw new Error("!"); })();
    const expected = test.expectedResult.includes(dir) ? test.expectedResult.filter(d => d != dir) : test.expectedResult.concat(dir);
    setProp("expectedResult", expected);
    const modifiedTest = selectedTest()!;
    props.saveTest(modifiedTest);
  };

  const changeSelectedSnake = (idx: number) => () => {
    setProp("snakeToTest", idx);
    const test = selectedTest() || (() => { throw new Error("!"); })();
    props.saveTest(test);
  };

  const changeTestedTurn = () => {
    setProp("frameToTest", displayTurn());
    const test = selectedTest() || (() => { throw new Error("!"); })();
    props.saveTest(test);
  };

  const cloneTest = () => {
    const test = selectedTest() || (() => { throw new Error("!"); })();
    const newTest = R.clone(test);
    newTest.id = nanoid(10);
    newTest.timestamp = Date.now();
    newTest.description = "(cloned) " + test.description;
    newTest.frameToTest = displayTurn();
    props.saveTest(newTest);
    setSelectedTest(newTest);
  };

  const testCurrentTurn = async () => {
    const test = selectedTest() || (() => { throw new Error("!"); })();
    const newTest = R.clone(test);
    newTest.frameToTest = displayTurn();
    newTest.expectedResult = ["Up", "Down", "Left", "Right"];
    const res = await props.runUnsavedTest(newTest);
    setTemporalTest({
      turn: newTest.frameToTest,
      move: res.move,
      msg: res.type == "failed" ? res.msg : undefined,
    });
  };

  return (
    <div class="flex flex-col m-4 bg-white shadow">
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
                  <button onclick={() => {setShowJson(true); setMenu(false);}} class="block w-full text-left px-4 py-2 text-sm capitalize text-gray-700 hover:bg-yellow-100">
                    export as JSON
                  </button>
                  <button onclick={handleAction(props.deleteTest, test.id)} class="block w-full text-left px-4 py-2 text-sm capitalize text-red-700 hover:bg-yellow-100">
                    delete
                  </button>
                </div>
              </Show>
            </div>
          </div>
          <div class="flex items-start flex-wrap p-6">
            <div class="inline-block">
              <Show when={selectedFrame()}>
                {(frame) =>
                  <Board
                    game={test.game}
                    frame={frame}
                  />
                }
              </Show>
              <div class="flex items-center mr-1">
                <div class="flex-1">
                  <span>turn:</span><input class="py-0 w-24 text-center focus:ring-0 border-none" type="number" value={displayTurn()} onInput={(e) => handleDisplayTurn(e)} />
                </div>
                <button title="test this turn" class="text-gray-500 p-1 rounded-md border border-white hover:border-gray-200" onclick={testCurrentTurn}>
                  <IconBiLightning />
                </button>
                <button title="use this turn for saved test" class="text-gray-500 p-1 rounded-md border border-white hover:border-gray-200" onclick={changeTestedTurn}>
                  <IconBiBoxArrowDown />
                </button>
                <button title="clone this test" class="text-gray-500 p-1 rounded-md border border-white hover:border-gray-200" onclick={cloneTest}>
                  <IconOcticonRepoForked24 />
                </button>
              </div>
            </div>
            <table>
              <For each={snakesSortedByDeath()}>
                {(snake) => {
                  const opacity = snake.death ? 0.3 : 1;
                  return (
                    <tr>
                      <td><IconOcticonTriangleRight class="text-gray-300" classList={{"text-blue-400": snake.idx == test.snakeToTest}} onclick={changeSelectedSnake(snake.idx)} /></td>
                      <td class="pr-2 py-1" style={{"font-size": 0, opacity}}><SnakeComponent color={snake.color} head={snake.headType} tail={snake.tailType}/></td>
                      <td class="text-right tabular-nums" style={{opacity}} >{snake.body.length}</td>
                      <td style={{opacity}}><IconElResizeHorizontal class="text-gray-500"/></td>
                      <td class="text-right tabular-nums w-10" style={{opacity}}>{snake.health}</td>
                      <td style={{opacity}}><IconClarityHeartSolid class="text-red-500" /></td>
                    </tr>
                  );
                }}
              </For>
            </table>
          </div>
          <Show when={temporalTest()}>
            <div class="p-6">
              <p class="text-gray-900">
                <span class="inline-block w-24">tested:</span>
                <span>Turn {temporalTest()?.turn}</span>
              </p>
              <p>
                <span class="inline-block w-24 text-gray-800">Answered:</span>
                <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-green-400": temporalTest()!.move == "Up"}}><IconTypcnArrowUpThick /></button>
                <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-green-400": temporalTest()!.move == "Down"}}><IconTypcnArrowDownThick /></button>
                <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-green-400": temporalTest()!.move == "Left"}}><IconTypcnArrowLeftThick /></button>
                <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-green-400": temporalTest()!.move == "Right"}}><IconTypcnArrowRightThick /></button>
                <span class="text-red-500">{temporalTest()!.msg}</span>
              </p>
            </div>
          </Show>
          <div class="p-6">
            <p class="text-gray-900">
              <span class="inline-block w-24">Saved test:</span>
              <span>Turn {test.frameToTest}</span>
            </p>
            <p>
              <span class="inline-block w-24 text-gray-800">Expected:</span>
              <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-blue-400": test.expectedResult.includes("Up")}} onclick={toggleDir("Up")}><IconTypcnArrowUpThick /></button>
              <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-blue-400": test.expectedResult.includes("Down")}} onclick={toggleDir("Down")}><IconTypcnArrowDownThick /></button>
              <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-blue-400": test.expectedResult.includes("Left")}} onclick={toggleDir("Left")}><IconTypcnArrowLeftThick /></button>
              <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-blue-400": test.expectedResult.includes("Right")}} onclick={toggleDir("Right")}><IconTypcnArrowRightThick /></button>
            </p>
            <p>
              <span class="inline-block w-24 text-gray-800">Answered:</span>
              <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-green-400": isOkAnswer("Up"), "bg-red-400": isWrongAnswer("Up")}}><IconTypcnArrowUpThick /></button>
              <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-green-400": isOkAnswer("Down"), "bg-red-400": isWrongAnswer("Down")}}><IconTypcnArrowDownThick /></button>
              <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-green-400": isOkAnswer("Left"), "bg-red-400": isWrongAnswer("Left")}}><IconTypcnArrowLeftThick /></button>
              <button class="bg-gray-200 rounded p-1 text-white mr-2" classList={{"bg-green-400": isOkAnswer("Right"), "bg-red-400": isWrongAnswer("Right")}}><IconTypcnArrowRightThick /></button>
              <span class="text-red-500">{failedMsg()}</span>
            </p>
            <button class="bg-blue-400 text-white mt-2 px-2 font-bold rounded" onclick={() => props.runSingleTest(test.id)}>Run Test</button>
          </div>
          <Modal title="Export as curl" switch={[showCurl, setShowCurl]}>
            <div class="flex-1 p-4">{() => <textarea readonly class="w-full h-full border-gray-200">{props.asCurl(selectedTest()!)}</textarea> }</div>
          </Modal>
          <Modal title="Export as json" switch={[showJson, setShowJson]}>
            <div class="flex-1 p-4">{() => <textarea readonly class="w-full h-full border-gray-200">{props.asJson(selectedTest()!)}</textarea> }</div>
          </Modal>
        </>}
      </Show>
    </div>
  );
}
