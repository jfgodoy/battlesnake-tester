import { createSignal, JSX, Switch, Match, For, Index } from "solid-js";
import Board from "./board";
import SnakeComponent from "./snake";
import { Frame, Game, Coord, Snake, Test, TestResult } from "../model";
import { Getter, Setter } from "../solid-utils";
import * as R from "ramda";
import styles from "./board-builder.module.css";
import { nanoid } from "nanoid";

const stylesAvailable = [
  {head: "default", tail: "default", color:"#2563EB"},
  {head: "default", tail: "default", color:"#D97706"},
  {head: "default", tail: "default", color:"#EF4444"},
  {head: "default", tail: "default", color:"#10B981"},
];

type BoardBuilderProps = {
  testResult: Getter<TestResult>,
  readTest: (id: string) => Promise<Test>,
  saveTest: Setter<Test>
  setView: Setter<string>,
};

export default function BoardBuilder(props: BoardBuilderProps): JSX.Element {
  const [mode, setMode] = createSignal<"pointer"|"add snake"|"hazards"|"delete">("pointer");
  const [selectedStyle, setSelectedStyle] = createSignal(0);

  const [frame, setFrame] = createSignal<Frame>({
    turn: 0,
    snakes: [],
    food: [],
    hazards: [],
  });

  const [game, setGame] = createSignal<Game>({
    id: "builder",
    timeout: 500,
    width: 11,
    height: 11,
    ruleset: {
      name: "standard",
      version: "v.1.2.3"
    }
  });

  const tr = props.testResult();
  const id = tr.id;

  props.readTest(id).then(test => {
    const game = R.clone(test.game);
    const frame = R.clone(test.frames.find(f => f.turn == test.frameToTest)!);
    frame.snakes = frame.snakes.filter(s => !s.death);

    setGame(game);
    setFrame(frame);
  });

  type DragState = {dragging: false} | {dragging: true, snakeIdx: number, snakeHandler: "head" | "tail" };
  let dragState: DragState = {dragging: false};
  const extractCoord = (el: SVGRectElement): Coord => {
    const x = +el.dataset.x!;
    const y = +el.dataset.y!;
    return {x, y};
  };

  const distance = (a: Coord, b: Coord) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const isFood = (c: Coord) => frame().food.some(coord => R.equals(coord, c));
  const isSnakePart = (c: Coord) => frame().snakes.some(s => s.body.some(coord => R.equals(coord, c)));
  const isCellEmpty = (c: Coord) => !isFood(c) && !isSnakePart(c);
  const isHazard = (c: Coord) => frame().hazards.some(coord => R.equals(coord, c));
  const isWall = (c: Coord) => c.x < 0 || c.y < 0 || c.x >= game().width || c.y >= game().height;
  const isWallOrHazard = (c: Coord) => isWall(c) || isHazard(c);

  const handleCell = (cell: SVGRectElement): void => {
    cell.addEventListener("mousedown", () => {
      const coord = extractCoord(cell);
      if (mode() == "add snake") {
        if (!isCellEmpty(coord)) {
          return;
        }
        const style = stylesAvailable[selectedStyle()];
        const snakeId = nanoid(5);
        const snake: Snake = {
          id: snakeId,
          name: "snake " + snakeId,
          url: "",
          body: [coord],
          health: 100,
          color: style.color,
          headType: style.head,
          tailType: style.tail,
          latency: "0",
          shout: "",
          squad: "",
          author: "board builder",
        };
        setFrame({...frame(), snakes: frame().snakes.concat([snake])});
        setMode("pointer");
        dragState = {dragging: true, snakeIdx: frame().snakes.length - 1, snakeHandler: "head"};
        return;
      }

      if (mode() == "hazards") {
        const top: Coord = {x: coord.x, y: coord.y + 1};
        const bottom: Coord = {x: coord.x, y: coord.y - 1};
        const left: Coord = {x: coord.x - 1, y: coord.y};
        const right: Coord = {x: coord.x + 1, y: coord.y};
        if (!isHazard(coord)) {
          const hazards = frame().hazards.slice();
          if (isWallOrHazard(top) || isWallOrHazard(bottom)) {
            for (let x = 0, n = game().width; x < n; x++) {
              hazards.push({x, y: coord.y});
            }
          }
          if (isWallOrHazard(left) || isWallOrHazard(right)) {
            for (let y = 0, n = game().height; y < n; y++) {
              hazards.push({x: coord.x, y});
            }
          }
          setFrame({...frame(), hazards: R.uniq(hazards)});
        } else {
          let hazards = frame().hazards.slice();
          if (!isWallOrHazard(top)  || !isWallOrHazard(bottom)) {
            hazards = hazards.filter(c => c.y != coord.y || (isWallOrHazard({x: c.x, y: c.y + 1}) && isWallOrHazard({x: c.x, y: c.y - 1})));
          }

          if (!isWallOrHazard(left) || !isWallOrHazard(right)) {
            hazards = hazards.filter(c => c.x != coord.x || (isWallOrHazard({x: c.x - 1, y: c.y}) && isWallOrHazard({x: c.x + 1, y: c.y})));
          }

          if (hazards.length === game().height * game().width) {
            // we are full of hazards
            hazards = hazards.filter(c => !R.equals(c, coord));
          }

          setFrame({...frame(), hazards});
        }
        return;
      }

      if (mode() == "delete") {
        if (isFood(coord)) {
          setFrame({...frame(), food: frame().food.filter(c => !R.equals(c, coord))});
          return;
        }
        const snakeIdx = frame().snakes.findIndex(s => s.body.find(c => R.equals(c, coord)));
        if (snakeIdx >= 0) {
          setFrame({...frame(), snakes: [...frame().snakes.slice(0, snakeIdx), ...frame().snakes.slice(snakeIdx + 1)]});
        }
        return;
      }

      // add food if coord is empty
      if (isCellEmpty(coord)) {
        setFrame({...frame(), food: [...frame().food, coord]});
        return;
      }

      // remove food if coord is food
      if (isFood(coord)) {
        setFrame({...frame(), food: frame().food.filter(c => !R.equals(c, coord))});
        return;
      }

      // check if coord is a head
      const  snakeIdxByHead = frame().snakes.findIndex(s => R.equals(s.body[0], coord));
      if (snakeIdxByHead >= 0) {
        dragState = {dragging: true, snakeIdx: snakeIdxByHead, snakeHandler: "head"};
        return;
      }

      // check if coord is tail
      const snakeIdxByTail = frame().snakes.findIndex(s => R.equals(s.body[s.body.length - 1], coord));
      if (snakeIdxByTail >= 0) {
        dragState = {dragging: true, snakeIdx: snakeIdxByTail, snakeHandler: "tail"};
      }
    });

    cell.addEventListener("mouseenter", () => {
      if (dragState.dragging) {
        const coord = extractCoord(cell);
        const selectedSnake = {...frame().snakes[dragState.snakeIdx]};
        selectedSnake.body = selectedSnake.body.slice();

        if (dragState.snakeHandler == "tail") {
          selectedSnake.body.reverse();
        }
        const head = selectedSnake.body[0];
        if (distance(head, coord) == 1) {
          if (selectedSnake.body[1] && R.equals(coord, selectedSnake.body[1])) {
            // over neck
            if (selectedSnake.body.length >= 2) {
              selectedSnake.body.shift();
            }
          } else {
            if (isCellEmpty(coord)) {
              selectedSnake.body.unshift(coord);
            }
          }

          if (dragState.snakeHandler == "tail") {
            selectedSnake.body.reverse();
          }

          const snakes = frame().snakes.slice();
          snakes[dragState.snakeIdx] = selectedSnake;
          setFrame({...frame(), snakes});
        } else if (distance(head, coord) == 2 && head.x != coord.x && head.y != coord.y) {
          if (selectedSnake.body[2] && R.equals(coord, selectedSnake.body[2])) {
            // over neck
            if (selectedSnake.body.length >= 3) {
              selectedSnake.body.shift();
              selectedSnake.body.shift();
            }
          } else {
            const option1 = {x: head.x, y: coord.y};
            const option2 = {x: coord.x, y: head.y};
            if (isCellEmpty(option1) && isCellEmpty(coord)) {
              selectedSnake.body.unshift(option1);
              selectedSnake.body.unshift(coord);
            } else if (isCellEmpty(option2) && isCellEmpty(coord)) {
              selectedSnake.body.unshift(option2);
              selectedSnake.body.unshift(coord);
            }
          }

          if (dragState.snakeHandler == "tail") {
            selectedSnake.body.reverse();
          }

          const snakes = frame().snakes.slice();
          snakes[dragState.snakeIdx] = selectedSnake;
          setFrame({...frame(), snakes});
        }
      }
    });

    window.addEventListener("mouseup", () => {
      dragState.dragging = false;
    });
  };

  const changeHealth = (e: Event, snakeIdx: number) => {
    const el = e.target as HTMLInputElement;
    const value = el.value.trim() != "" ? +el.value : 0;
    const new_val = Math.min(Math.max(0, value), 100);
    el.value = el.value.trim() != "" ? new_val.toString() : "";
    const snakes = frame().snakes.slice();
    snakes[snakeIdx] = {...snakes[snakeIdx], health: new_val};
    setFrame({...frame(), snakes});
  };


  async function save() {
    const oldTest = await props.readTest(id);
    const createNew = oldTest.frames.length > 1;

    const test: Test = {
      id: createNew ? nanoid(10) : oldTest.id,
      timestamp: Date.now(),
      description: createNew ? "(truncated) " + oldTest.description : oldTest.description,
      game: game(),
      frames: [frame()],
      frameToTest: frame().turn,
      snakeToTest: oldTest.snakeToTest <= frame().snakes.length - 1 ? oldTest.snakeToTest : 0,
      expectedResult: oldTest.expectedResult
    };
    await props.saveTest(test);
    props.setView("test");
  }


  return (<div class="flex flex-col m-4 bg-white shadow">
    <h3 class="text-gray-500 text-xl p-6">Board builder</h3>
    <div class="flex items-start flex-wrap p-6">
            <div class="inline-block">
              <Board frame={frame()} game={game()} ref={handleCell} class="cursor-pointer"/>
              <div class="flex items-center mr-1">
                <button title="edit snake" class="text-gray-500 p-1 rounded-md border border-white hover:border-gray-200" onclick={() => setMode("pointer")}>
                  <IconFaSolidHandPointer />
                </button>
                <button title="new snake" class="text-gray-500 p-1 rounded-md border border-white hover:border-gray-200" onclick={() => setMode("add snake")}>
                  <IconMdiSnake />
                </button>
                <button title="add hazards" class="text-gray-500 p-1 rounded-md border border-white hover:border-gray-200" onclick={() => setMode("hazards")}>
                  <IconHealthiconsHazardous />
                </button>
                <button title="delete element" class="text-gray-500 p-1 rounded-md border border-white hover:border-gray-200" onclick={() => setMode("delete")}>
                  <IconFaSolidTrash />
                </button>
              </div>
            </div>
            <table>
              <Index each={frame().snakes}>
                {(snake, i) => {
                  return (
                    <tr>
                      <td class="pr-2 py-1" style={{"font-size": 0}}><SnakeComponent color={snake().color} head={snake().headType} tail={snake().tailType}/></td>
                      <td class="text-right tabular-nums">{snake().body.length}</td>
                      <td><IconElResizeHorizontal class="text-gray-500"/></td>
                      <td class="text-right tabular-nums w-10">
                        <input
                          class="p-0 w-12 text-right focus:ring-0 border-none"
                          classList={{[styles.hideSpinner]: true}}
                          type="number"
                          value={snake().health}
                          oninput={e => changeHealth(e, i)}/>
                      </td>
                      <td><IconClarityHeartSolid class="text-red-500" /></td>
                    </tr>
                  );
                }}
              </Index>
            </table>
          </div>
    <div class="p-6">
      <Switch>
        <Match when={mode() == "pointer"}>
          <p>Drag the head or the tail of a snake to change its size.</p>
        </Match>
        <Match when={mode() == "add snake"}>
          <p>Add a new snake. Choose a style and then drag an empty cell.</p>
          <ul>
            <For each={stylesAvailable}>
              {(style, i) => (
                <li class="flex items-center my-2">
                  <input type="radio" name="snakeStyle" oninput={() => setSelectedStyle(i())} checked/>
                  <label class="ml-1" style="font-size:0">
                    <SnakeComponent head={style.head} tail={style.tail} color={style.color} />
                  </label>
                </li>
              )}
            </For>
          </ul>
        </Match>
        <Match when={mode() == "hazards"}>
          <p>Add hazards in row or column by clicking in a cell next to a wall or another hazards.</p>
        </Match>
        <Match when={mode() == "delete"}>
          <p>Delete a snakes or food by clicking them</p>
        </Match>
      </Switch>
    </div>
    <div class="p-6">
      <button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={() => save()}>Save</button>
    </div>
  </div>);
}
