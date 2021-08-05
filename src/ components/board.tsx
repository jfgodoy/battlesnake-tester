import Grid from "./grid";

const BOARD_SIZE = 300;

function Board(props) {
  return <svg viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}>
    <Grid
      snakes={props.snakes}
      food={props.food}
      foodImage={props.foodImage}
      hazards={props.hazards}
      columns={props.columns}
      rows={props.rows}
      highlightedSnake={props.highlightedSnake}
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
