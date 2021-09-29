import { createMemo, JSX, For } from "solid-js";
import { RenderCtx } from "./index";
import { Frame } from "../../model";
import { colors } from "../../theme/index";

const hazardOpacity = parseFloat(colors.hazardOpacity);

export default function Hazard(props: {ctx: RenderCtx, frame: Frame}): JSX.Element {
  const ctx = props.ctx;
  const hazards = createMemo(() => props.frame.hazards || []);
  return (
    <For each={hazards()}>
      {(h) =>  (
        <rect
          x={ctx.toGridSpaceX(h.x)}
          y={ctx.toGridSpaceY(h.y)}
          width={ctx.cellSize}
          height={ctx.cellSize}
          fill={colors.hazard}
          fill-opacity={hazardOpacity}
          class="pointer-events-none"
        />
      )}
    </For>
  );
}
