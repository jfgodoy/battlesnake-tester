import Grid from "./grid";
import {Snake, Coord} from "../model";

const BOARD_SIZE = 100;

interface BoardOptions {
  snakes: Snake[],
  food: Coord[],
  hazards: any[],
  columns: number
  rows: number
  turn: number,
  theme: string,
}


function Board(props: BoardOptions) {
  return <svg viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}>
    <Grid
      snakes={props.snakes}
      food={props.food}
      hazards={props.hazards}
      columns={props.columns}
      rows={props.rows}
      theme={props.theme}
      maxWidth={BOARD_SIZE}
      maxHeight={BOARD_SIZE}
      x={0}
      y={0}
      turn={props.turn}
    />
  </svg>
}

export default Board;
