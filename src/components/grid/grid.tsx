import { colors } from "../../theme/index";
import { JSX, PropsWithChildren } from "solid-js";
import { RenderCtx } from "./index";

function range(size: number) {
  const result: number[] = [];
  for (let i = 0; i < size; i++) {
    result.push(i);
  }
  return result;
}


export default function RenderGrid(props: PropsWithChildren<{ctx: RenderCtx, ref: (el: SVGRectElement) => void}>): JSX.Element {
  const ctx = props.ctx;
  const viewBoxWidth = (ctx.cellSize + ctx.cellSpacing) * ctx.gameWidth + ctx.cellSpacing;
  const viewBoxHeight = (ctx.cellSize + ctx.cellSpacing) * ctx.gameHeight + ctx.cellSpacing;

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>

      {range(ctx.gameHeight).map((_, row) =>
        range(ctx.gameWidth).map((_, col) => (
          <rect
            x={ctx.toGridSpaceX(col)}
            y={ctx.toGridSpaceY(row)}
            width={ctx.cellSize}
            height={ctx.cellSize}
            fill={colors.gridCellBackground}
            data-x={col}
            data-y={row}
            ref={props.ref}
          />
        ))
      )}

      {props.children}
    </svg>
  );
}

