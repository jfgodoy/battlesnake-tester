import Grid from "./grid";
import { Game, Frame } from "../model";
import { splitProps } from "solid-js";
import type { JSX } from "solid-js";
import styles from "./board.module.css";

const BOARD_SIZE = 300;

interface BoardOptions {
  frame: Frame,
  game: Game,
  theme: string,
}


function Board(allProps: BoardOptions & JSX.StylableSVGAttributes): JSX.Element {
  const [props, otherProps] = splitProps(allProps, ["frame", "game", "theme"]);
  return (
    <div class={styles.Board} {...otherProps}>
      <Grid
        {...props}
        maxWidth={BOARD_SIZE}
        maxHeight={BOARD_SIZE}
        x={0}
        y={0}
      />
    </div>
  );
}

export default Board;
