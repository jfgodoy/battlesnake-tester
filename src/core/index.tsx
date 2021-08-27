import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import { Test, TestResult, Passed, Failed } from "../model";
import { indexdbTestStore } from "./test-store";
import { signalFromStore, SignalFromStoreReturnType } from "../solid-utils";
import { runTest } from "../core/tester";

const testStorage = indexdbTestStore();

const [state, setState] = createStore({
  server: "http://localhost:8080",
  testedSnake: {
    style: undefined as {color: string, head: string, tail: string} | undefined,
  },
  testResults: [] as TestResult[],
  selected: 0,
  view: "test",
});


(function bootstrap() {
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
})();

export const selectedTestResult = createMemo(() => state.testResults[state.selected]);

export async function runSingleTest(id: string): Promise<Passed | Failed> {
  const test = await testStorage.read(id);
  const res = await runTest(`${state.server}/move`, test);
  const found = state.testResults.findIndex(tr => tr.id == id);
  if (found >= 0) {
    setState("testResults", found, "result", res);
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

export const saveTest = (test: Test): Promise<void> => testStorage.save(test);
export const readTest = (id: string): Promise<Test> => testStorage.read(id);

export function signalFor<PathType extends string>(path: PathType extends "" ? never : PathType): SignalFromStoreReturnType<typeof state, PathType> {
  return signalFromStore(state, setState, path);
}


