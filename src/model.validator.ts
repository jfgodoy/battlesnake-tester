import ow from "ow";

export const GameShape = ow.object.exactShape({
  id: ow.string,
  ruleset: {
    name: ow.string,
    version: ow.string,
  },
  timeout: ow.number,
  width: ow.number,
  height: ow.number,
});

export const CoordShape = ow.object.exactShape({
  x: ow.number,
  y: ow.number,
});

export const DeathShape = ow.object.exactShape({
  cause: ow.string,
  turn: ow.number,
  eliminatedBy: ow.string,
});

export const SnakeShape = ow.object.exactShape({
  id: ow.string,
  name: ow.string,
  url: ow.string,
  body: ow.array.ofType(CoordShape),
  health: ow.number,
  death: ow.any(DeathShape, ow.undefined),
  color: ow.string,
  headType: ow.string,
  tailType: ow.string,
  latency: ow.string,
  shout: ow.string,
  squad: ow.string,
  author: ow.string,
});

export const FrameShape = ow.object.exactShape({
  turn: ow.number,
  snakes: ow.array.ofType(SnakeShape),
  food: ow.array.ofType(CoordShape),
  hazards: ow.array.ofType(CoordShape),
});


export const DirectionStrShape = ow.string.oneOf(["Up", "Down", "Left", "Right"]);

export const TestShape = ow.object.exactShape({
  id: ow.string,
  description: ow.string,
  timestamp: ow.number,
  game: GameShape,
  frames: ow.array.ofType(FrameShape),
  frameToTest: ow.number,
  snakeToTest: ow.number,
  expectedResult: ow.array.ofType(DirectionStrShape),
});




