import { createMemo, JSX } from "solid-js";
import { Frame, Game } from "../../model";
import { renderGrid } from "./grid";

export interface GridOptions {
  frame: Frame,
  game: Game,
  maxWidth: number,
  maxHeight: number,
  x:number,
  y:number,
  theme: string,
}

function Grid(props: GridOptions): JSX.Element {
  // hack to rerender all the Grid
  const el = createMemo(() => renderGrid(props));
  return el;
}

export default Grid;
