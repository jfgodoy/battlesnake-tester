import { Direction, DirectionStr, Test, Passed, Failed } from "../model";
import { createSnakeRequest, MoveRequest, sendRequest } from "./request";

export function createRequestData(test: Test): MoveRequest | string {
  const frame = test.frames.find(fr => fr.turn == test.frameToTest);
  if (!frame) { return "frame to test not found"; }
  const snakeToTest = frame.snakes[test.snakeToTest];
  if (!snakeToTest) {
    return "snake to test not found";
  }
  if (snakeToTest.death) {
    return "Omae Wa Mou Shindeiru";
  }
  const you = createSnakeRequest(snakeToTest);
  const snakes = frame.snakes.filter(s => !s.death).map(createSnakeRequest);
  const moveRequest: MoveRequest = {
    board: {
      food: frame.food,
      snakes: snakes,
      width: test.game.width,
      height: test.game.height,
      hazards: frame.hazards,
    },
    game: {
      id: test.game.id,
      ruleset: test.game.ruleset,
      timeout: test.game.timeout,
    },
    turn: frame.turn,
    you,
  };
  return moveRequest;
}

export async function runTest(url: string, test: Test): Promise<Passed | Failed>  {
  const moveRequest = createRequestData(test);
  if (typeof moveRequest == "string") {
    return {type: "failed", msg: moveRequest};
  }
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
