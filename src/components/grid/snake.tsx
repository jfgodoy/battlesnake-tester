import { colors } from "../../theme/index";
import { Snake, Direction, Frame } from "../../model";
import { createRenderableSnake, PartType, RenderableSnake, SnakePart } from "../../utils/render";
import { createMemo, createResource, Show, JSX } from "solid-js";
import { RenderCtx } from "./index";

const DEAD_OPACITY = 0.1;
const OVERLAP_OPACITY = 0.3;
const SNAKE_ON_SNAKE_OPACITY = 0.8;
const FULL_OPACITY = 1.0;

const END_OVERLAP = 0.2;
const DIRECTIONS_CW = [Direction.Up, Direction.Right, Direction.Down, Direction.Left];

enum CornerType { TopLeft, TopRight, BottomRight, BottomLeft }

function getPartWidth(part: SnakePart, ctx: RenderCtx) {
  const extraWidth =
    part.direction === Direction.Left || part.direction === Direction.Right
      ? 2 * ctx.cellSpacing
      : 0;
  return ctx.cellSize + extraWidth;
}

function getPartHeight(part: SnakePart, ctx: RenderCtx) {
  const extraHeight =
    part.direction === Direction.Up || part.direction === Direction.Down ? 2 * ctx.cellSpacing : 0;
  return ctx.cellSize + extraHeight;
}

function getPartXOffset(part: SnakePart, ctx: RenderCtx) {
  const xBias =
    part.direction === Direction.Left || part.direction === Direction.Right ? - ctx.cellSpacing : 0;
  return ctx.toGridSpaceX(part.x) + xBias;
}

function getPartYOffset(part: SnakePart, ctx: RenderCtx) {
  const yBias =
    part.direction === Direction.Up || part.direction === Direction.Down ? - ctx.cellSpacing : 0;
  return ctx.toGridSpaceY(part.y) + yBias;
}

function getCornerPartXOffset(part: SnakePart, ctx: RenderCtx) {
  return ctx.toGridSpaceX(part.x) - ctx.cellSpacing;
}

function getCornerPartYOffset(part: SnakePart, ctx: RenderCtx) {
  return ctx.toGridSpaceY(part.y) - ctx.cellSpacing;
}

function getTailXOffset(part: SnakePart, ctx: RenderCtx) {
  // apply slight offset to avoid ugly white line in between parts (works most of the time)
  switch (part.direction) {
    case Direction.Left:
      return ctx.toGridSpaceX(part.x) - END_OVERLAP;
    case Direction.Right:
      return ctx.toGridSpaceX(part.x) + END_OVERLAP;
    default:
      return ctx.toGridSpaceX(part.x);
  }
}

function getTailYOffset(part: SnakePart, ctx: RenderCtx) {
  // apply slight offset to avoid ugly white line in between parts (works most of the time)
  switch (part.direction) {
    case Direction.Up:
      return ctx.toGridSpaceY(part.y) - END_OVERLAP;
    case Direction.Down:
      return ctx.toGridSpaceY(part.y) + END_OVERLAP;
    default:
      return ctx.toGridSpaceY(part.y);
  }
}

function getHeadXOffset(part: SnakePart, ctx: RenderCtx) {
  // apply slight offset to avoid ugly white line in between parts (works most of the time)
  switch (part.direction) {
    case Direction.Left:
      return ctx.toGridSpaceX(part.x) + END_OVERLAP;
    case Direction.Right:
      return ctx.toGridSpaceX(part.x) - END_OVERLAP;
    default:
      return ctx.toGridSpaceX(part.x);
  }
}

function getHeadYOffset(part: SnakePart, ctx: RenderCtx) {
  // apply slight offset to avoid ugly white line in between parts (works most of the time)
  switch (part.direction) {
    case Direction.Up:
      return ctx.toGridSpaceY(part.y) + END_OVERLAP;
    case Direction.Down:
      return ctx.toGridSpaceY(part.y) - END_OVERLAP;
    default:
      return ctx.toGridSpaceY(part.y);
  }
}

function getHeadFillerXOffset(part: SnakePart, ctx: RenderCtx) {
  // apply slight offset to avoid ugly white line in between parts (works most of the time)
  switch (part.direction) {
    case Direction.Left:
      return ctx.toGridSpaceX(part.x + 1) - ctx.cellSpacing - END_OVERLAP;
    case Direction.Right:
      return ctx.toGridSpaceX(part.x) - ctx.cellSpacing - END_OVERLAP;
    default:
      return ctx.toGridSpaceX(part.x);
  }
}

function getHeadFillerYOffset(part: SnakePart, ctx: RenderCtx) {
  // apply slight offset to avoid ugly white line in between parts (works most of the time)
  switch (part.direction) {
    case Direction.Up:
      return ctx.toGridSpaceY(part.y - 1) - ctx.cellSpacing - END_OVERLAP;
    case Direction.Down:
      return ctx.toGridSpaceY(part.y) - ctx.cellSpacing - END_OVERLAP;
    default:
      return ctx.toGridSpaceY(part.y);
  }
}

function getFillerWidth(part: SnakePart, ctx: RenderCtx) {
  return part.direction === Direction.Left || part.direction === Direction.Right
    ? ctx.cellSpacing + 2 * END_OVERLAP
    : ctx.cellSize;
}

function getFillerHeight(part: SnakePart, ctx: RenderCtx) {
  return part.direction === Direction.Left || part.direction === Direction.Right
    ? ctx.cellSize
    : ctx.cellSpacing + 2 * END_OVERLAP;
}

function isDead(snake: Snake) {
  return !!snake.death;
}

function getOpacity(snake: Snake) {
  return isDead(snake) ? DEAD_OPACITY : 1;
}

function getPartOpacity(part: SnakePart) {
  if (part.shadeForOverlap) {
    return SNAKE_ON_SNAKE_OPACITY;
  } else if (part.isOverlapped) {
    return OVERLAP_OPACITY;
  } else {
    return FULL_OPACITY;
  }
}

function getPartColor(snake: Snake, part: SnakePart): string {
  if (part.shadeForOverlap) {
    return colors.overlapSnake;
  } else {
    return snake.color;
  }
}

function sortAliveSnakesOnTop(snakes: Snake[]): Snake[] {
  return snakes.concat().sort((a, b) => {
    const aOrder = isDead(a) ? 0 : 1;
    const bOrder = isDead(b) ? 0 : 1;
    return aOrder - bOrder;
  });
}

function getHeadTransform(direction: Direction, viewBox: {width: number, height: number}) {
  const halfX = viewBox.width / 2;
  const halfY = viewBox.height / 2;
  switch (direction) {
    case Direction.Left:
      return `scale(-1,1) translate(-100, 0)`;
    case Direction.Up:
      return `rotate(-90 ${halfX} ${halfY})`;
    case Direction.Down:
      return `rotate(90 ${halfX} ${halfY})`;
    default:
      return "";
  }
}

function getTailTransform(direction: Direction, viewBox: {width: number, height: number}) {
  const halfX = viewBox.width / 2;
  const halfY = viewBox.height / 2;
  switch (direction) {
    case Direction.Right:
      return `scale(-1,1) translate(-100,0)`;
    case Direction.Down:
      return `scale(-1,1) translate(-100,0) rotate(-90 ${halfX} ${halfY})`;
    case Direction.Up:
      return `scale(-1,1) translate(-100,0) rotate(90 ${halfX} ${halfY})`;
    default:
      return "";
  }
}

function areAdjacentDirections(d1: Direction, d2: Direction) {
  // Check if the directions are adjacent in the circular directions array
  // Otherwise they are the same or opposite directions
  return (
    Math.abs(DIRECTIONS_CW.indexOf(d1) - DIRECTIONS_CW.indexOf(d2)) % 2 === 1
  );
}

function checkIfCornerPart(snake: RenderableSnake, partIndex: number) {
  // If head or tail of the snake, then false
  if (partIndex === 0 || partIndex === snake.parts.length - 1) { return false; }

  const behind = snake.parts[partIndex + 1];
  const current = snake.parts[partIndex];

  // Return false if the behind part has the same position as the current.
  // Relevant for when the snake initially spawns.
  if (behind.x === current.x && behind.y === current.y) { return false; }

  // Check if the directions are adjacent in the circular directions array
  // Otherwise they are the same or opposite directions and should be rendered with a straight part
  return areAdjacentDirections(current.direction, behind.direction);
}

function determineCornerType(snake: RenderableSnake, partIndex: number): CornerType {
  if (snake.parts[partIndex].type != PartType.BODY) {
    throw new Error("do not call determineCornerType on a non body part");
  }

  const current = snake.parts[partIndex].direction;
  const behind = snake.parts[partIndex + 1].direction;

  if (current == Direction.Up && behind == Direction.Right || current == Direction.Left && behind == Direction.Down) {
    return CornerType.TopLeft;
  }
  if (current == Direction.Up && behind == Direction.Left || current == Direction.Right && behind == Direction.Down) {
    return CornerType.TopRight;
  }
  if (current == Direction.Down && behind == Direction.Left || current == Direction.Right && behind == Direction.Up) {
    return CornerType.BottomRight;
  }
  if (current == Direction.Down && behind == Direction.Right || current == Direction.Left && behind == Direction.Up) {
    return CornerType.BottomLeft;
  }
  throw new Error("unreachable");
}

function isOverlappedByTail(snake: RenderableSnake, part: SnakePart) {
  const tail = snake.body[snake.body.length - 1];
  return part.isOverlapped && tail.x === part.x && tail.y === part.y;
}

function renderPart(snake: RenderableSnake, snakeIndex: number, part: SnakePart, partIndex: number, ctx: RenderCtx) {
  if (isOverlappedByTail(snake, part)) { return; }
  switch (part.type) {
    case PartType.HEAD:
      return renderHeadPart(snake, snakeIndex, part, ctx);
    case PartType.TAIL:
      return renderTailPart(snake, snakeIndex, part, ctx);
    case PartType.BODY:
      if (checkIfCornerPart(snake, partIndex)) {
        return renderCornerPart(snake, snakeIndex, part, partIndex, ctx);
      } else {
        return renderMiddlePart(snake, snakeIndex, part, partIndex, ctx);
      }
  }
}

function renderHeadPart(snake: RenderableSnake, snakeIndex: number, part: SnakePart, ctx: RenderCtx) {
  const x = getHeadXOffset(part, ctx);
  const y = getHeadYOffset(part, ctx);
  const HeadSVG = snake.headSvg;
  const box = {x: 0, y: 0, width: 100, height: 100};
  const transform = getHeadTransform(part.direction, box);
  const viewBoxStr = `${box.x} ${box.y} ${box.width} ${box.height}`;
  const color = getPartColor(snake, part);
  const opacity = getPartOpacity(part);

  return (
    <g>
      <svg
        viewBox={viewBoxStr}
        x={x}
        y={y}
        width={ctx.cellSize}
        height={ctx.cellSize}
        opacity={opacity}
      >
        <g transform={transform}>
          <HeadSVG fill={color} />
        </g>
      </svg>
      {snake.effectiveSpace > 1 && (
        // only add filler if the snake is effectively longer than one tile
        <rect
          x={getHeadFillerXOffset(part, ctx)}
          y={getHeadFillerYOffset(part, ctx)}
          width={getFillerWidth(part, ctx)}
          height={getFillerHeight(part, ctx)}
          fill={color}
          opacity={opacity}
        />
      )}
    </g>
  );
}

function renderMiddlePart(snake: Snake, snakeIndex: number, part: SnakePart, partIndex: number, ctx: RenderCtx) {
  const color = getPartColor(snake, part);
  const opacity = getPartOpacity(part);

  return (
    <rect
      x={getPartXOffset(part, ctx)}
      y={getPartYOffset(part, ctx)}
      width={getPartWidth(part, ctx)}
      height={getPartHeight(part, ctx)}
      fill={color}
      opacity={opacity}
    />
  );
}

function renderCornerPart(snake: RenderableSnake, snakeIndex: number, part: SnakePart, partIndex: number, ctx: RenderCtx) {
  const path = "M0,20 h60 a60,60 0 0 1 60,60 v60 h-100 v-20 h-20 z";
  const color = getPartColor(snake, part);
  const opacity = getPartOpacity(part);
  const viewBox = "0 0 140 140";
  let transform;

  const cornerType = determineCornerType(snake, partIndex);
  switch (cornerType) {
    case CornerType.BottomRight:
      transform = "rotate(270, 70, 70)";
      break;
    case CornerType.TopLeft:
      transform = "rotate(90, 70, 70)";
      break;
    case CornerType.BottomLeft:
      break;
    case CornerType.TopRight:
      transform = "rotate(180, 70, 70)";
      break;
  }

  return (
    <svg
      x={getCornerPartXOffset(part, ctx)}
      y={getCornerPartYOffset(part, ctx)}
      width={ctx.cellSize + 2 * ctx.cellSpacing}
      height={ctx.cellSize + 2 * ctx.cellSpacing}
      fill={color}
      opacity={opacity}
      viewBox={viewBox}
    >
      <path d={path} transform={transform} />
    </svg>
  );
}

function renderTailPart(snake: RenderableSnake, snakeIndex: number, part: SnakePart, ctx: RenderCtx) {
  const x = getTailXOffset(part, ctx);
  const y = getTailYOffset(part, ctx);
  const TailSVG = snake.tailSvg;
  const box = {x: 0, y: 0, width: 100, height: 100};
  const transform = getTailTransform(part.direction, box);
  const viewBoxStr = `${box.x} ${box.y} ${box.width} ${box.height}`;
  const color = getPartColor(snake, part);
  const opacity = getPartOpacity(part);

  return (
    <svg
      viewBox={viewBoxStr}
      x={x}
      y={y}
      width={ctx.cellSize}
      height={ctx.cellSize}
      opacity={opacity}
    >
      <g transform={transform}>
        <TailSVG fill={color} />
      </g>
    </svg>
  );
}


async function prepareSnakes(ctx: RenderCtx, snakes: Snake[]): Promise<RenderableSnake[]> {
  // Make alive snakes render on top of dead snakes and create renderable snakes
  const renderableSnakes = await Promise.all(sortAliveSnakesOnTop(snakes).map(s => createRenderableSnake(s)));

  // track all of the grid cells that will have a snake part drawn in them.  Successive snake parts
  // drawn in the same cell need to be flagged so they render differently and layer properly
  const gridCellsWithSnakeParts = Array(ctx.gameHeight);
  for (let i = 0; i < gridCellsWithSnakeParts.length; i++) {
    gridCellsWithSnakeParts[i] = Array(ctx.gameWidth);
    for (let j = 0; j < ctx.gameWidth; j++) {
      gridCellsWithSnakeParts[i][j] = false;
    }
  }

  // Go through each snake, in the order they will be drawn and mark the cells they will occupy.
  // flag parts that would be drawn in cells that are already claimed
  for (let i = 0; i < renderableSnakes.length; i++) {
    const snake = renderableSnakes[i];
    if (!isDead(snake)) {
      for (let x = 0; x < snake.parts.length; x++) {
        const part = snake.parts[x];
        if (!isOverlappedByTail(snake, part)) {
          if (gridCellsWithSnakeParts[part.y][part.x]) {
            part.shadeForOverlap = true;
          } else {
            gridCellsWithSnakeParts[part.y][part.x] = true;
          }
        }
      }
    }
  }
  return renderableSnakes;
}

export default function SnakeComponent(props: {ctx: RenderCtx, frame: Frame}): JSX.Element {
  const ctx = props.ctx;
  const snakes = createMemo(() => props.frame.snakes || []);
  const [renderableSnakes] = createResource(snakes, (snakes) => prepareSnakes(ctx, snakes));

  return (
    <Show when={!renderableSnakes.loading}>
      {renderableSnakes()!.map((snake, snakeIndex) => {
        return (
          <g
            opacity={getOpacity(snake)}
            class="pointer-events-none"
          >
            {[...snake.parts]
              .reverse()
              .map((part, partIndex) =>
                renderPart(
                  snake,
                  snakeIndex,
                  part,
                  snake.parts.length - partIndex - 1,
                  ctx,
                )
              )}
          </g>
        );
      })}
    </Show>
  );
}

