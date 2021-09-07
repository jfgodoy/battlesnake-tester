import Grid from "./grid";
import { Game, Frame } from "../model";
import { mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import styles from "./board.module.css";

interface BoardOptions {
  frame: Frame,
  game: Game,
  ref?: (el: SVGRectElement) => void,
}


function Board(allProps: BoardOptions & JSX.StylableSVGAttributes): JSX.Element {
  const [props, otherProps] = splitProps(allProps, ["frame", "game", "ref"]);
  const gridProps = mergeProps({ref: () => void 0}, props);
  return (
    <div class={styles.Board} {...otherProps}>
      <Grid {...gridProps} />
    </div>
  );
}

export default Board;
