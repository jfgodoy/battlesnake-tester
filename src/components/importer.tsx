import { createSignal, createEffect, Show, JSX, onMount } from "solid-js";
import { nanoid } from "nanoid";
import { Test } from "../model";
import { importGame } from "../core/importer";
import { prefetchSvgs } from "../utils/render";
import { runTest } from "../core/tester";
import { Getter, Setter, $model, onInput } from "../solid-utils";
import TestEditor from "./test-editor";

const GAMEID_REGEX = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/;

export default function Importer(props: { server: Getter<string>, saveTest: Setter<Test>, theme: string }): JSX.Element {
  const [gameId, setGameId] = createSignal("");
  const [importState, setImportState] = createSignal("");
  const [currentTest, setCurrentTest] = createSignal(undefined as Test | undefined);
  const [answer, setAnswer] = createSignal("");

  const doImport = async () => {
    setImportState("importing...");
    const res = await importGame(gameId())
      .catch(e => {
        // TODO: improve error messages
        setImportState(e);
        throw e;
      });

    const test: Test = {
      id: nanoid(10),
      description: "",
      timestamp: Date.now(),
      game: res.game,
      frames: res.frames,
      frameToTest: 0,
      snakeToTest: 0,
      expectedResult: [],
    };

    const firstFrame = res.frames[0];
    if (firstFrame) {
      await prefetchSvgs(firstFrame.snakes);
    }

    setCurrentTest(test);
  };

  const prepareTest = (): Test | undefined => {
    const t = currentTest();
    if (!t || t.frames.length == 0) {
      return undefined;
    }
    return {
      ...t,
      id: nanoid(10),
      timestamp: Date.now(),
    };
  };

  const runSingleTest = async () => {
    const test = currentTest();
    if (test) {
      const res = await runTest(`${props.server()}/move`, test);
      setAnswer(res.move || res.msg);
    }
  };

  const saveTest = () => {
    const test = prepareTest();
    if (test) {
      props.saveTest(test);
    }
  };

  const textToGameId = (val: string): string => {
    const match = GAMEID_REGEX.exec(val);
    if (match) {
      return match[0];
    }
    return val;
  };

  createEffect(() => {
    const match = GAMEID_REGEX.exec(gameId());
    if (match) {
      doImport();
    }
  });

  let gameIdInput: HTMLInputElement | undefined;
  onMount(() => gameIdInput?.focus());

  return (
    <div class="m-4 p-4 bg-white">
      <h3 class="text-lg text-gray-700">Game importer</h3>
      <div class="flex my-4">
        <div class="space-y-2">
          <Show when={!currentTest()}>
            <div>
              <span>Game ID:</span>
              <input ref={gameIdInput} class="py-0 rounded border-gray-400 mx-2 w-84 inline-block" type="text" placeholder="Game ID or url" use:$model={onInput(gameId, val => setGameId(textToGameId(val)))} />
              <p>{importState}</p>
            </div>
          </Show>
          <Show when={currentTest()}>
              <TestEditor test={[() => currentTest()!, (test: Test) => setCurrentTest(test)]} theme={props.theme}/>
              <Show when={answer()}>
                <div>
                  <span>your answer: {answer()}</span>
                </div>
              </Show>
              <div>
                <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={() => runSingleTest()}>Run test</button>
                <button class="bg-blue-400 text-white px-2 ml-2 font-bold rounded" onclick={() => saveTest()}>Save test</button>
              </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
