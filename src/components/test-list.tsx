import { createSelector, Show, For, Switch, Match, batch, createEffect, JSX } from "solid-js";
import { Signal, Getter, Setter } from "../solid-utils";
import { TestResult, AsyncState } from "../model";

type TestListProps = {
  runAllTests: () => void,
  selected: Signal<number>,
  setView: Setter<string>,
  testResults: Getter<TestResult[]>,
  importExamples: () => Promise<void>,
  dbStatus: Getter<AsyncState>,
}

export default function TestList(props: TestListProps): JSX.Element {
  const [selected, setSelected] = props.selected;
  const setView = props.setView;
  const testResults = props.testResults;

  const isSelected = createSelector(selected);
  const loadTest = (index: number) => {
    batch(() => {
      setSelected(index);
      setView("test");
    });
  };

  const scrollToSelected = (el: HTMLElement) => {
    createEffect(() => el.querySelectorAll("li")[selected()]?.scrollIntoView({block: "nearest"}));
  };

  const ImportExamples = () => {
    return (<div class="text-center">
      <p class="text-gray-500">You don't have any tests yet. You can create one by importing a game, or just import some examples to get started.</p>
      <button class="mt-2 bg-blue-400 text-white px-2 font-bold rounded" onclick={() => props.importExamples()}>Import examples</button>
    </div>);
  };

  return (
    <div class="flex flex-col w-full">
      <div class="flex flex-0 justify-between mb-4">
        <p class="font-bold text-gray-500">Tests available:</p>
        <Show when={props.dbStatus().type == "done" && testResults().length > 0}>
          <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={props.runAllTests}>Run all tests</button>
        </Show>
      </div>
      <div class="overflow-y-auto" ref={scrollToSelected}>
        <Switch>
          <Match when={props.dbStatus().type == "loading"}>
            loading...
          </Match>
          <Match when={props.dbStatus().type == "error"}>
            <p class="text-red-500">
            { () => {
              const status = props.dbStatus();
              return status.type == "error" && status.message;
            }}
            </p>
          </Match>
          <Match when={props.dbStatus().type == "done"}>
            <ul>
              <For each={testResults()} fallback={ImportExamples}>
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
          </Match>
        </Switch>
      </div>
    </div>
  );
}
