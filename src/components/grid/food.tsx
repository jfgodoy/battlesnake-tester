import { createMemo, JSX, For } from "solid-js";
import { RenderCtx } from "./index";
import { Frame } from "../../model";
import { colors } from "../../theme/index";

export default function Food(props:{ctx: RenderCtx, frame: Frame}): JSX.Element {
  const ctx = props.ctx;
  const FOOD_SIZE = (ctx.cellSize / 3.25).toFixed(2);
  const food = createMemo(() => props.frame.food || []);
  return (
    <For each={food()}>
      {(f) =>  (
        <circle
          cx={ctx.toGridSpaceX(f.x) + ctx.cellSize / 2}
          cy={ctx.toGridSpaceY(f.y) + ctx.cellSize / 2}
          r={FOOD_SIZE}
          fill={colors.food}
          class="pointer-events-none"
        />
      )}
    </For>
  );
}
