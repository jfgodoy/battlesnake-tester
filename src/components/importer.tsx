import { createSignal, createEffect, JSX, onMount } from "solid-js";
import { nanoid } from "nanoid";
import { Test } from "../model";
import { importGame } from "../core/importer";
import { Getter, Setter, $model, onInput } from "../solid-utils";
import ow from "ow";
import { TestShape } from "../model.validator";

const GAMEID_REGEX = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/;

export default function Importer(props: { server: Getter<string>, saveTest: Setter<Test>, setView: Setter<string>}): JSX.Element {
  const [gameId, setGameId] = createSignal("");
  const [importState, setImportState] = createSignal("");

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
      description: `test for ${res.game.id}`,
      timestamp: Date.now(),
      game: res.game,
      frames: res.frames,
      frameToTest: 0,
      snakeToTest: 0,
      expectedResult: [],
    };

    await props.saveTest(test);
    props.setView("test");
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

  const [jsonTest, setJsonTest] = createSignal("");
  const [jsonError, setJsonError] = createSignal<undefined|string>();
  createEffect(async () => {
    setJsonError();
    const val = jsonTest();
    if (val) {
      try {
        const obj = JSON.parse(val);
        ow(obj, TestShape);
        const test: Test = obj as Test;
        test.id = nanoid(10);
        test.timestamp = Date.now();
        await props.saveTest(test);
        props.setView("test");
      } catch (e) {
        setJsonError(e.message);
      }
    }
  });

  return (
    <div>
      <div class="m-4 p-6 bg-white shadow">
        <h3 class="text-lg text-gray-700">Create test from game</h3>
        <div class="flex my-4">
          <div class="space-y-2">
            <div>
              <span>Game ID or URL:</span>
              <input ref={gameIdInput} class="py-0 rounded border-gray-400 mx-2 w-84 inline-block" type="text" use:$model={onInput(gameId, val => setGameId(textToGameId(val)))} />
              <p>{importState}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="m-4 p-6 bg-white shadow">
        <h3 class="text-lg text-gray-700">Import from Json</h3>
        <div class="flex my-4">
          <div class="space-y-2">
            <div>
              <p> If you have a previouly exported test as Json, you can import it pasting the source here:</p>
              <textarea class="rounded border-gray-400 mt-2 w-full inline-block" use:$model={onInput(jsonTest, setJsonTest)} />
              <p class="text-red-500">{jsonError}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
