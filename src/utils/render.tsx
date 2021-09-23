import { ComponentProps } from "solid-js";
import { fetchSVG } from "../core/svg-fetcher";
import {Snake, Coord, Direction} from "../model";

const DEFAULT_DIRECTION = Direction.Up;

type SVGGComponent = (props?: ComponentProps<"image"> & {fill: string}) => SVGGElement;
export interface RenderableSnake extends Snake {
  parts: SnakePart[],
  effectiveSpace: number,
  headSvg: SVGGComponent,
  tailSvg: SVGGComponent,
}

export async function createRenderableSnake(snake: Snake): Promise<RenderableSnake> {
  const head = fetchSVG("head", snake.headType);
  const tail = fetchSVG("tail", snake.tailType);
  const renderedParts = snake.body.filter((_, i) => shouldRenderPart(snake, i));
  return Object.assign({}, snake, {
    parts: snake.body.map((_, i) => formatSnakePart(snake, i)),
    effectiveSpace: renderedParts.length,
    headSvg: await head,
    tailSvg: await tail,
  });
}

export interface SnakePart extends Coord {
  direction: Direction,
  type: PartType,
  isOverlapped?: boolean,
  shadeForOverlap: boolean,
}

function formatSnakePart(snake: Snake, partIndex: number): SnakePart {
  const part = snake.body[partIndex];
  const type = getType(snake, partIndex);
  const { x, y } = part;
  const direction = formatDirection(type, snake, part, partIndex);
  const isOverlapped = !shouldRenderPart(snake, partIndex) ? true : undefined;

  return {
    direction,
    type,
    isOverlapped,
    x,
    y,
    shadeForOverlap: false,
  };
}

function shouldRenderPart(snake: Snake, partIndex: number): boolean {
  const headIndex = 0;
  const tailIndex = snake.body.length - 1;
  const head = snake.body[headIndex];
  const tail = snake.body[tailIndex];
  const currPart = snake.body[partIndex];

  // always render head
  if (partIndex === headIndex) {
    return true;
  }

  // render tail if not covered by head
  if (partIndex === tailIndex) {
    return !(head.x === currPart.x && head.y === currPart.y);
  }

  // render middle part if it's in a different position than
  // the next piece closer to head, and not in same spot as tail
  const nextPart = snake.body[partIndex - 1];
  return (
    !(tail.x === currPart.x && tail.y === currPart.y) &&
    !(head.x === currPart.x && head.y === currPart.y) &&
    !(nextPart && nextPart.x === currPart.x && nextPart.y === currPart.y)
  );
}

function formatDirection(type: PartType, snake: Snake, part: Coord, partIndex: number) {
  let direction;
  if (snake.body.length == 1) {
    direction = Direction.Up;
  } else if (type === PartType.HEAD) {
    direction = getDirection(snake.body[1], snake.body[0]);
  } else {
    // handle special case where parts overlap
    let prevPart;
    do {
      prevPart = snake.body[Math.max(partIndex - 1, 0)];
      --partIndex;
    } while (partIndex > 0 && prevPart.x === part.x && prevPart.y === part.y);

    direction = getDirection(part, prevPart);
  }

  return direction;
}

function getDirection(a: Coord, b: Coord): Direction {
  if (a.x < b.x) {
    return Direction.Right;
  } else if (a.x > b.x) {
    return Direction.Left;
  } else if (a.y > b.y) {
    return Direction.Down;
  } else if (a.y < b.y) {
    return Direction.Up;
  }
  return DEFAULT_DIRECTION;
}

export enum PartType { HEAD, TAIL, BODY }
function getType(snake: Snake, partIndex: number): PartType {
  if (partIndex === 0) {
    return PartType.HEAD;
  }

  if (partIndex === snake.body.length - 1) {
    return PartType.TAIL;
  }

  return PartType.BODY;
}

