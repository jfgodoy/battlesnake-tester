import Grid from "./grid";
import { Game, Frame } from "../model";
import { splitProps } from "solid-js";
import type { JSX } from "solid-js";
import styles from "./board.module.css";

interface BoardOptions {
  frame: Frame,
  game: Game,
}


function Board(allProps: BoardOptions & JSX.StylableSVGAttributes): JSX.Element {
  const [props, otherProps] = splitProps(allProps, ["frame", "game"]);
  return (
    <div class={styles.Board} {...otherProps}>
      <Grid {...props} />
    </div>
  );
}

export default Board;
