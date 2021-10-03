import { createMemo } from "solid-js";
import { createStore, Store, SetStoreFunction } from "solid-js/store";
import { Test, TestResult, Passed, Failed, Pending, Snake, AsyncState } from "../model";
import { indexdbTestStore, ExportedData } from "./test-store";
import { signalFromStore, SignalFromStoreReturnType } from "../solid-utils";
import { runTest, createRequestData } from "../core/tester";
import { nanoid } from "nanoid";

const testStorage = indexdbTestStore();

const storeDefaults = {
  server: "http://localhost:8080",
  testedSnake: {
    style: undefined as Pick<Snake, "color" | "headType" | "tailType"> | undefined,
  },
  testResults: [] as TestResult[],
  selected: 0,
  view: "home",
  dbStatus: {type: "loading"} as AsyncState,
  snakeUrl: undefined as undefined | string,
};
type MyStore = typeof storeDefaults;

const [state, setState] = (function bootstrap(): [Store<MyStore>, SetStoreFunction<MyStore>] {
  const savedProps = JSON.parse(localStorage.getItem("state") || "{}");
  const storeData: MyStore = Object.assign({}, storeDefaults, savedProps);
  const [state, setStateRaw] = createStore(storeData);
  type SetStateType = typeof setStateRaw;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setState: SetStateType = (...args: any[]): void => {
    const res =  setStateRaw.call(null, ...args);
    const savedProps = JSON.parse(localStorage.getItem("state") || "{}");
    savedProps.server = state.server;
    savedProps.selected = state.selected;
    savedProps.view = state.view;
    savedProps.snakeUrl = state.snakeUrl;
    localStorage.setItem("state", JSON.stringify(savedProps));
    return res;
  };

  testStorage.list()
    .then(tests => {
      const testResults: TestResult[] = tests.map(preview => ({...preview, result: {type: "pending"}}));
      setState("testResults", testResults);
      setState("dbStatus", {type: "done"});
    })
    .catch(err => {
      setState("dbStatus", {type: "error", message: err.message});
    });

  testStorage.suscribe((before, after) => {
    // added
    if (!before && after) {
      const testResult: TestResult = {
        id: after.id,
        description: after.description,
        timestamp: after.timestamp,
        result: {type: "pending"},
      };
      setState("testResults", l => [...l, testResult]);
      setState("selected", state.testResults.length - 1);
    }
    // deleted
    if (before && !after) {
      const filtered = state.testResults.filter(t => t.id != before.id);
      setState("testResults", filtered);
      setState("selected", Math.min(state.testResults.length - 1, state.selected));
    }
    // updated
    if (before && after) {
      const getUpdatedResult = (): Passed | Failed | Pending => {
        const previousResult = state.testResults.find(t => t.id == after.id)?.result || {type: "pending"};
        if (previousResult.type == "pending") {
          return previousResult;
        }
        const previousMove = previousResult.move;
        if (!previousMove) {
          return { type: "failed", msg: previousResult.msg};
        }

        const passed = after.expectedResult.includes(previousMove);
        if (passed) {
          return {type: "passed", move: previousMove};
        } else {
          return {type: "failed", move: previousMove, msg: "incorrect move"};
        }
      };

      const testResult: TestResult = {
        id: after.id,
        description: after.description,
        timestamp: after.timestamp,
        result: getUpdatedResult(),
      };
      const updated = state.testResults.map(t => t.id == after.id ? testResult : t);
      setState("testResults", updated);
    }
  });

  return [state, setState];
})();

export const selectedTestResult = createMemo(() => state.testResults[state.selected]);

export async function runSingleTest(id: string): Promise<Passed | Failed> {
  const test = await testStorage.read(id);
  const res = await runTest(`${state.server}/move`, test);
  const found = state.testResults.findIndex(tr => tr.id == id);
  if (found >= 0) {
    // set state merge objects, so we create a cleaned result
    const clean = {type: undefined, move: undefined, msg: undefined};
    setState("testResults", found, "result", {...clean, ...res});
  }
  return res;
}

export async function runAllTests(): Promise<void> {
  const testIds = state.testResults.map(t => t.id);
  const promises = testIds
    .map(id => testStorage.read(id))
    .map(testPromise => testPromise.then(test => runTest(`${state.server}/move`, test)));

  const results = await Promise.all(promises);
  const updatedTestResults = state.testResults.map(t => {
    const idx = testIds.indexOf(t.id);
    return (idx >= 0) ? {...t, result: results[idx]} : t;
  });

  setState("testResults", updatedTestResults);
}

export function runUnsavedTest(test: Test): Promise<Passed | Failed> {
  return runTest(`${state.server}/move`, test);
}

export const saveTest = (test: Test): Promise<void> => testStorage.save(test);
export const readTest = (id: string): Promise<Test> => testStorage.read(id);
export const deleteTest = (id: string): Promise<void> => testStorage.delete(id);
export const exportToJson = (): Promise<ExportedData> => testStorage.exportToJson();
export const importFromJson = async (data: ExportedData, options: {mode: "add" | "replace"}): Promise<void> => {
  await testStorage.importFromJson(data, options);
  testStorage.list()
    .then(tests => {
      const testResults: TestResult[] = tests.map(preview => ({...preview, result: {type: "pending"}}));
      setState("testResults", testResults);
      setState("dbStatus", {type: "done"});
    })
    .catch(err => {
      setState("dbStatus", {type: "error", message: err.message});
    });
};

export function signalFor<PathType extends string>(path: PathType extends "" ? never : PathType): SignalFromStoreReturnType<typeof state, PathType> {
  return signalFromStore(state, setState, path);
}

export const asCurl = (test: Test): string => {
  const reqData = createRequestData(test);
  if (typeof reqData == "string") {
    return "Error: " + reqData;
  }
  return `curl -H "Content-type:application/json" --data-raw '${JSON.stringify(reqData)}' ${state.server}/move`;
};

export const asJson = (test: Test): string => {
  return JSON.stringify(test);
};


export const createEmptyTest = async (): Promise<Test> => {
  const test: Test = {
    id: nanoid(10),
    description: "new test",
    timestamp: Date.now(),
    frameToTest: 0,
    snakeToTest: 0,
    expectedResult: [],
    frames: [
      {
        turn: 0,
        snakes: [],
        food: [],
        hazards: [],
      }
    ],
    game: {
      id: "new game",
      timeout: 500,
      width: 11,
      height: 11,
      ruleset: {
        name: "standard",
        version: "v.1.2.3"
      }
    }
  };
  await saveTest(test);
  return test;
};

export const importExamples = async (): Promise<void> => {
  const examples = (await import("./examples")).default;
  await Promise.all(examples.map(example => saveTest(example)));
};
