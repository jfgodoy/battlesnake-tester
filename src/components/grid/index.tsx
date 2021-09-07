import { JSX } from "solid-js";
import { Frame, Game } from "../../model";
import RenderGrid from "./grid";
import SnakeComponent from "./snake";
import Food from "./food";
import Hazard from "./hazard";

const CELL_SIZE = 20;
const CELL_SPACING = 4;

export type RenderCtx = {
  cellSize: number,
  cellSpacing: number,
  gameHeight: number,
  gameWidth: number,
  toGridSpaceX: (x: number) => number,
  toGridSpaceY: (y: number) => number,
}

export interface GridOptions {
  frame: Frame,
  game: Game,
  ref: (el: SVGRectElement) => void,
}

function Grid(props: GridOptions): JSX.Element {
  const ctx: RenderCtx = {
    cellSize: CELL_SIZE,
    cellSpacing: CELL_SPACING,
    gameWidth: props.game.width,
    gameHeight: props.game.height,
    toGridSpaceX: (x: number) => (CELL_SIZE + CELL_SPACING) * x + CELL_SPACING,
    // Y-Axis in board space is inverted, positive goes up
    toGridSpaceY: (y: number) => (CELL_SIZE + CELL_SPACING) * (props.game.height - 1 - y) + CELL_SPACING,
  };


  return (
    <RenderGrid ctx={ctx} ref={props.ref}>
      <SnakeComponent ctx={ctx} frame={props.frame} />
      <Food ctx={ctx} frame={props.frame}/>
      <Hazard ctx={ctx} frame={props.frame}/>
    </RenderGrid>
  );
}

export default Grid;
