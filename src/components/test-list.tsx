import { createSelector, For, Switch, Match, batch, createEffect, JSX } from "solid-js";
import { Signal, Getter, Setter } from "../solid-utils";
import { TestResult } from "../model";

type TestListProps = {
  runAllTests: () => void,
  selected: Signal<number>,
  setView: Setter<string>,
  testResults: Getter<TestResult[]>
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
    createEffect(() => el.querySelectorAll("li")[selected()]?.scrollIntoView());
  };

  return (
    <div class="flex flex-col w-full">
      <div class="flex flex-0 justify-between mb-4">
        <p class="font-bold text-gray-500">Tests available:</p>
        <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={props.runAllTests}>Run all tests</button>
      </div>
      <div class="overflow-y-auto" ref={scrollToSelected}>
        <ul>
          <For each={testResults()}>
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
      </div>
    </div>
  );
}
