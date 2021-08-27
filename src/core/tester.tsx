import { Direction, DirectionStr, Test, Passed, Failed } from "../model";
import { createSnakeRequest, MoveRequest, sendRequest } from "./request";

export async function runTest(url: string, test: Test): Promise<Passed | Failed>  {
  const frame = test.frames.find(fr => fr.turn == test.frameToTest);
  if (!frame) { return {type: "failed", msg: "frame to test not found" };}
  const you = createSnakeRequest(frame.snakes[test.snakeToTest]);
  const snakes = frame.snakes.filter(s => !s.death).map(createSnakeRequest);
  const moveRequest: MoveRequest = {
    board: {
      food: frame.food,
      snakes: snakes,
      width: test.game.width,
      height: test.game.height,
    },
    game: {
      id: test.game.id,
      ruleset: test.game.ruleset,
      timeout: test.game.timeout,
    },
    turn: frame.turn,
    you,
  };
  const result = await sendRequest(url, moveRequest);
  const expected: DirectionStr[] = test.expectedResult;
  switch (result.type) {
    case "ok": {
      const answeredDirStr = Direction[result.value] as DirectionStr;
      if (expected.indexOf(answeredDirStr) >= 0) {
        return {type: "passed", move: answeredDirStr};
      } else {
        return {type: "failed", move: answeredDirStr, msg: "incorrect move"};
      }
    }
    case "error":
      return {type: "failed", msg: result.msg };
  }
}
