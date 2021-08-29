import { createMemo, For, JSX } from "solid-js";
import { DirectionStr, Test } from "../model";
import { Getter, Setter, $model, onBlur } from "../solid-utils";
import Board from "./board";

export default function TestEditor(props: { test: [Getter<Test>, Setter<Test>], theme: string }): JSX.Element {
  const [test, setTest] = props.test;

  const getter = <K extends keyof Test>(prop: K) => () => test()[prop];
  const setter = <K extends keyof Test, V extends Test[K]>(prop: K) => (value: V) => setTest({...test(), [prop]: value});
  const setProp = <K extends keyof Test, V extends Test[K]>(prop: K, value: V) => setTest({...test(), [prop]: value});

  const frameToTest = createMemo(() => test().frames.find(f => f.turn == test().frameToTest)!);

  function handleFrameToTest(e: Event) {
    const el = e.target as HTMLInputElement;
    const value = el.value.trim() != "" ? +el.value : 0;
    const frames = test().frames;
    const minTurn = frames[0]!.turn;
    const maxTurn = frames[frames.length - 1]!.turn;
    const frameToTest = Math.max(minTurn, Math.min(value, maxTurn));
    el.value = el.value.trim() != "" ? frameToTest.toString() : "";
    setProp("frameToTest", frameToTest);
  }

  function handleSnakeSelector(e: Event) {
    const el = e.target as HTMLInputElement;
    if (el.checked) {
      setProp("snakeToTest", +el.value);
    }
  }

  const snakesAvailable = createMemo((): {name: string, deathInfo: string, isDeathNow: boolean}[] => {
    const t = test();
    const currrentFrame = frameToTest();
    const currentFrameSnakes = currrentFrame.snakes || [];
    const lastFrameSnakes = t.frames[t.frames.length - 1]!.snakes || [];
    const res = [];
    for (let i = 0; i < currentFrameSnakes.length; i++) {
      const death = lastFrameSnakes[i]?.death;
      res.push({
        name: currentFrameSnakes[i]!.name,
        deathInfo: death ? `rip in turn ${death.turn}` : "winner",
        isDeathNow: !!currentFrameSnakes[i]!.death,
      });
    }
    return res;
  });

  const RadioDirections = (props: {options: DirectionStr[], items: Getter<DirectionStr[]>, setItems: (items: DirectionStr[]) => void, }) => {
    const checked = createMemo(() => {
      const array = props.items().map(() => false);
      props.items().forEach(item => {
        const idx = props.options.findIndex(option => option == item);
        if (idx >= 0) {
          array[idx] = true;
        }
      });
      return array;
    });

    const isChecked = (i: number) => checked()[i];
    const toggle = (i: number) => {
      const array = checked();
      array[i] = !array[i];
      const directions = props.options.filter((_, i) => array[i]);
      props.setItems(directions);
    };

    return (
      <For each={props.options}>
        {(item, i) => <><label><input type="checkbox" value={item} checked={isChecked(i())} onChange={() => toggle(i())} />{item.toLowerCase()}</label><br /></>}
      </For>
    );
  };

  return (
    <div class="flex">
      <div class="space-y-2">
        <div>
          <span class="inline-block w-1/3">test description:</span>
          <input class="inline-block w-3/6 py-0 rounded border-gray-400 ml-2" type="text" use:$model={onBlur(getter("description"), setter("description"))} />
        </div>
        <div>
          <span class="inline-block w-1/3">frame to test:</span>
          <input class="inline-block w-3/6 py-0 rounded border-gray-400 ml-2" type="number" value={test().frameToTest} onInput={(e) => handleFrameToTest(e)} />
        </div>
        <div>
          <span>snake to test:</span><br />
          <For each={snakesAvailable()}>{(snakeInfo, i) => <>
            <label style={{opacity: snakeInfo.isDeathNow ? 0.4 : 1}}>
              <input
                type="radio"
                name="snakeToTest"
                value={i()}
                checked={test().snakeToTest == i()}
                disabled={snakeInfo.isDeathNow}
                onChange={e => handleSnakeSelector(e)}
              />
              {snakeInfo.name} ({snakeInfo.deathInfo})
            </label>
            <br />
          </>}</For>
        </div>
        <div>
          <span>expected direction(s):</span><br />
          <RadioDirections options={["Up", "Down", "Left", "Right"]} items={getter("expectedResult")} setItems={setter("expectedResult")} />
        </div>
      </div>
      <div>
        <Board
          game={test().game}
          frame={frameToTest()}
          theme={props.theme}
        />
      </div>
    </div>
  );
}
